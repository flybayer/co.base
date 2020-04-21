import { streamOf } from '@aven/stream';

const { spawn } = require('child_process');

function parseClipLines(lines) {
  return Object.fromEntries(
    lines
      .map(line => {
        const r = line.match(
          /^(\d+): (.*) (\d\d:\d\d:\d\d;\d\d) (\d\d:\d\d:\d\d;\d\d)\r$/,
        );
        if (!r) return false;
        return [
          r[1],
          { id: r[1], name: r[2], duration: r[4], startTime: r[3] },
        ];
      })
      .filter(Boolean),
  );
}

function objectOfLines(lines) {
  return Object.fromEntries(
    lines
      .map(line => {
        const r = line.split(': ');
        if (!r[1]) return false;
        return [r[0], r[1].slice(0, -1)];
      })
      .filter(Boolean),
  );
}

export default function createVDeck({ source, docName, host, port = '9993' }) {
  const conn = spawn('nc', [host, port]);
  const [deckValueStream, setDeckValue] = streamOf({
    status: 'init',
    monitorEnabled: true,
  });
  let pendingCommand;
  let pendingCommandPromise = Promise.resolve();
  let commandResolver = null;
  let commandRejecter = null;

  async function sendCommand(command) {
    pendingCommandPromise = pendingCommandPromise.then(() => {
      pendingCommand = command;
      conn.stdin.write(command);
      conn.stdin.write('\n');
      return new Promise((resolve, reject) => {
        commandResolver = resolve;
        commandRejecter = err => {
          console.error(`Error within VDeck command "${pendingCommand}"`);
          reject(err);
        };
      });
    });
    return pendingCommandPromise;
  }
  function handleSlot(lines) {
    const slot = Object.fromEntries(lines.map(line => line.split(': ')));
    setDeckValue({
      ...deckValueStream.get(),
      [`Slot${slot['slot id']}`]: slot,
    });
  }
  function handleTransport(lines) {
    const lastDeckValue = deckValueStream.get();
    const transportUpdates = objectOfLines(lines);
    setDeckValue({
      ...lastDeckValue,
      transport: {
        ...(lastDeckValue.transport || {}),
        ...transportUpdates,
      },
    });
  }
  async function handleConnection(lines) {
    await sendCommand('device info');
    await sendCommand(
      `preview: enable: ${
        deckValueStream.get().monitorEnabled ? 'true' : 'false'
      }`,
    );
    await sendCommand('notify: remote: true');
    await sendCommand('notify: transport: true');
    await sendCommand('notify: slot: true');
    await sendCommand('notify: configuration: true');
    await sendCommand('notify: dropped frames: true');
    await sendCommand('slot info: slot id: 1');
    await sendCommand('slot info: slot id: 2');
    await sendCommand('transport info');
    await sendCommand('clips get');
    setDeckValue({
      ...deckValueStream.get(),
      ...Object.fromEntries(
        lines
          .map(line => {
            const r = line.split(': ');
            if (!r[1]) return false;
            return [r[0], r[1].replace('\r', '')];
          })
          .filter(Boolean),
      ),
      status: 'ready',
    });
  }
  function handleMessage(code, status, lines) {
    if (code === '500') {
      //status === 'connection'
      handleConnection(lines);
    } else if (code === '502') {
      //status === 'slot'
      handleSlot(lines);
    } else if (code === '508') {
      //status === 'transport'
      handleTransport(lines);
    } else if (code === '510') {
      //status === 'remote'
      const lastDeckValue = deckValueStream.get();
      const remote = objectOfLines(lines);
      setDeckValue({
        ...lastDeckValue,
        remote: {
          ...(lastDeckValue.remote || {}),
          ...remote,
        },
      });
    } else if (code === '511') {
      //status === 'configuration'
      const lastDeckValue = deckValueStream.get();
      const config = objectOfLines(lines);
      setDeckValue({
        ...lastDeckValue,
        config: {
          ...(lastDeckValue.config || {}),
          ...config,
        },
      });
    } else if (code === '512') {
      //status === 'dropped'
      console.log('dropped', lines);
    } else if (code === '100') {
      //status === 'syntax' // error

      commandRejecter(new Error('SyntaxError'));
    } else if (Number(code) >= 200 && Number(code) < 300) {
      //status === 'ok' // 200
      if (code === '202') {
        // status === 'slot'
        const slot = objectOfLines(lines);
        setDeckValue({
          ...deckValueStream.get(),
          [`Slot${slot['slot id']}`]: slot,
        });
      } else if (code === '204') {
        // status === 'device info'
        const deviceInfo = objectOfLines(lines);
        setDeckValue({
          ...deckValueStream.get(),
          ...deviceInfo,
        });
      } else if (code === '205') {
        const clipLines = lines.slice(1);
        setDeckValue({
          ...deckValueStream.get(),
          clips: parseClipLines(clipLines),
        });
      } else if (code === '208') {
        // status === 'transport'
        const transport = objectOfLines(lines);
        setDeckValue({
          ...deckValueStream.get(),
          transport,
        });
      }
      commandResolver({ code, status, lines });
    } else {
      console.log(code, status);
    }
  }

  function handleMessages(messages) {
    let code = null;
    let status = null;
    let lines = [];
    messages.forEach(msg => {
      if (msg === '') {
        handleMessage(code, status, lines);
        code = null;
        status = null;
        lines = [];
      } else if (!code) {
        const codeMsg = msg.split(' ');
        code = codeMsg[0];
        status = codeMsg[1];
      } else {
        lines.push(msg);
      }
    });
  }
  conn.stdout.on('data', switchMessageBuffer => {
    const switchMessage = String(switchMessageBuffer);
    handleMessages(switchMessage.split('\n'));
  });
  source.docs.setOverrideValueStream(docName, deckValueStream);
  conn.stderr.on('data', errMessage => {
    console.error(`VDeck netcat error: ${errMessage}`);
  });
  conn.on('close', () => {
    // console.log('conn closed');
  });
  function close() {
    conn.kill();
    setDeckValue({
      ...deckValueStream.get(),
      status: 'closed',
    });
  }
  async function setMonitorEnabled(value) {
    setDeckValue({
      ...deckValueStream.get(),
      monitorEnabled: value,
    });
    await sendCommand(`preview: enable: ${value ? 'true' : 'false'}`);
  }
  return {
    close,
    actions: {
      async VDeckMonitorToggle() {
        const { monitorEnabled } = deckValueStream.get();
        await setMonitorEnabled(!monitorEnabled);
      },
      async VDeckMonitorEnable() {
        await setMonitorEnabled(true);
      },
      async VDeckMonitorDisable() {
        await setMonitorEnabled(false);
      },
      async VDeckPlay() {
        await sendCommand('play');
      },
      async VDeckRecord() {
        await sendCommand('record');
      },
      async VDeckStop() {
        await sendCommand('stop');
      },
    },
  };
}
