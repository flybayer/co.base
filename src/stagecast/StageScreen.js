import React from 'react';
import { View, Text } from '@rn';
import SimplePage from './SimplePage';

let idCount = 0;
function VideoRecorder() {
  const recorder = React.useRef(null);
  const elementId = React.useMemo(() => {
    idCount += 1;
    return `videoRecorder-${idCount}`;
  }, []);
  React.useEffect(() => {
    recorder.current = window.videojs(elementId, {
      controls: true,
      width: 320,
      height: 240,
      fluid: false,
      plugins: {
        record: {
          audio: true,
          video: true,
          maxLength: 10,
          debug: true,
        },
      },
    });
    return () => {
      recorder.current.destroy();
    };
  }, []);
  return <video id={elementId} className="video-js vjs-default-skin" />;
}

export default function StageScreen({ navigation }) {
  const orgId = navigation.getParam('orgId');
  const stageId = navigation.getParam('stageId');
  return (
    <SimplePage>
      <View>
        <Text>
          hiho, {orgId} {stageId}
        </Text>
      </View>
      <VideoRecorder />
    </SimplePage>
  );
}
