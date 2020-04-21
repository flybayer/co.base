import { streamOf } from '@aven/stream';

const { spawn } = require('child_process');

function getEntries(messages, delimiter = ' ') {
  return messages.map(msg => {
    const terms = msg.split(delimiter);
    return [terms[0], terms.slice(1).join(' ')];
  });
}

export default function createVSwitch({
  source,
  docName,
  host,
  port = '9990',
}) {
  const conn = spawn('nc', [host, port]);
  const [switchValueStream, setSwitchValue] = streamOf({
    status: 'init',
  });
  function handleProtocol(messages) {
    const entries = getEntries(messages, ': ');
    entries.forEach(([key, value]) => {
      if (key === 'Version') {
        setSwitchValue({
          ...switchValueStream.get(),
          'Protocol Version': value,
        });
      }
    });
  }
  function handleHubInfo(messages) {
    const entries = getEntries(messages, ': ');
    setSwitchValue({
      ...switchValueStream.get(),
      ...Object.fromEntries(entries),
    });
  }
  function handleInputLabels(messages) {
    const entries = getEntries(messages);
    const switchValue = { ...switchValueStream.get() };
    entries.forEach(([key, value]) => {
      switchValue[`Input${key}Label`] = value;
    });
    setSwitchValue(switchValue);
  }
  function handleOutputLabels(messages) {
    const entries = getEntries(messages);
    const switchValue = { ...switchValueStream.get() };
    entries.forEach(([key, value]) => {
      switchValue[`Output${key}Label`] = value;
    });
    setSwitchValue(switchValue);
  }
  function handleOutputLocks(messages) {
    const entries = getEntries(messages);
    const switchValue = { ...switchValueStream.get() };
    entries.forEach(([key, value]) => {
      switchValue[`Output${key}Lock`] = value !== 'U';
    });
    setSwitchValue(switchValue);
  }
  function handleOutputRouting(messages) {
    const entries = getEntries(messages);
    const switchValue = { ...switchValueStream.get() };
    entries.forEach(([key, value]) => {
      switchValue[`Output${key}RouteIn`] = Number(value);
    });
    setSwitchValue(switchValue);
  }
  function handleConfig(messages) {
    const entries = messages.map(msg => {
      const a = msg.split(': ');
      return [`Config ${a[0]}`, a[1]];
    });
    setSwitchValue({
      ...switchValueStream.get(),
      ...Object.fromEntries(entries),
    });
  }
  function handlePreludeEnd() {
    setSwitchValue({
      ...switchValueStream.get(),
      status: 'ready',
    });
  }

  function handleMessages(messages) {
    let inputState = null;
    let inputMessages = [];
    messages.forEach(msg => {
      if (msg === 'PROTOCOL PREAMBLE:') inputState = 'PROTOCOL PREAMBLE';
      else if (msg === 'VIDEOHUB DEVICE:') inputState = 'VIDEOHUB DEVICE';
      else if (msg === 'INPUT LABELS:') inputState = 'INPUT LABELS';
      else if (msg === 'OUTPUT LABELS:') inputState = 'OUTPUT LABELS';
      else if (msg === 'VIDEO OUTPUT LOCKS:') inputState = 'VIDEO OUTPUT LOCKS';
      else if (msg === 'VIDEO OUTPUT ROUTING:')
        inputState = 'VIDEO OUTPUT ROUTING';
      else if (msg === 'CONFIGURATION:') inputState = 'CONFIGURATION';
      else if (msg === 'END PRELUDE:') inputState = 'END PRELUDE';
      else if (msg === '') {
        if (inputState === 'PROTOCOL PREAMBLE') {
          handleProtocol(inputMessages);
        } else if (inputState === 'VIDEOHUB DEVICE') {
          handleHubInfo(inputMessages);
        } else if (inputState === 'INPUT LABELS') {
          handleInputLabels(inputMessages);
        } else if (inputState === 'OUTPUT LABELS') {
          handleOutputLabels(inputMessages);
        } else if (inputState === 'VIDEO OUTPUT LOCKS') {
          handleOutputLocks(inputMessages);
        } else if (inputState === 'VIDEO OUTPUT ROUTING') {
          handleOutputRouting(inputMessages);
        } else if (inputState === 'CONFIGURATION') {
          handleConfig(inputMessages);
        } else if (inputState === 'END PRELUDE') {
          handlePreludeEnd();
        }
        inputState = null;
        inputMessages = [];
      } else {
        inputMessages.push(msg);
      }
    });
  }
  conn.stdout.on('data', switchMessageBuffer => {
    const switchMessage = String(switchMessageBuffer);
    handleMessages(switchMessage.split('\n'));
  });
  source.docs.setOverrideValueStream(docName, switchValueStream);
  conn.stderr.on('data', errMessage => {
    console.error(`VSwitch netcat error: ${errMessage}`);
  });
  conn.on('close', () => {
    // console.log('conn closed');
  });
  function close() {
    conn.kill();
    setSwitchValue({
      ...switchValueStream,
      status: 'closed',
    });
  }
  return {
    close,
    actions: {
      VSwitchRoute({ dest, input }) {
        conn.stdin.write(`VIDEO OUTPUT ROUTING:\n${dest} ${input}\n\n`);
      },
    },
  };
}
