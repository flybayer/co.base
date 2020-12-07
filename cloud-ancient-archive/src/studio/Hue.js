import fetch from 'node-fetch';
import { streamOf } from '@aven/stream';

export default function createHue({ source, apiKey, host, docName }) {
  const [hueValueStream, setHueValueStream] = streamOf({
    status: 'init',
  });

  async function readAllHue() {
    const allRead = await fetch(`http://${host}/api/${apiKey}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const allReadData = await allRead.json();
    const groupsRead = await fetch(`http://${host}/api/${apiKey}/groups`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const groupsReadData = await groupsRead.json();
    setHueValueStream({
      ...hueValueStream.get(),
      status: 'ready',
      hue: allReadData,
      hueGroups: groupsReadData,
    });
  }

  function readForever() {
    readAllHue()
      .then(new Promise(resolve => setTimeout(resolve, 450)))
      .finally(readForever);
  }

  readForever(); // thats clumsy..

  source.docs.setOverrideValueStream(docName, hueValueStream);

  function close() {}
  return {
    close,
    actions: {},
  };
}
