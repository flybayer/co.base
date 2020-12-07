import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCloud } from '@aven/cloud-core';
import { HostContext } from '@aven/cloud-core';
import { Text, Button, useTheme, Stack, opacify } from '@aven/plane';
import { View } from '@rn';

export default function FileInput({
  uploadDoc,
  value,
  label,
  onValue = () => {},
  theme: themeProp,
}) {
  const theme = useTheme(themeProp);
  const cloud = useCloud();
  const { authority, useSSL } = React.useContext(HostContext);
  const filesValue = value || [];
  const [isUploading, setIsUploading] = React.useState(false);
  const onDrop = useCallback(
    files => {
      const formData = new FormData();
      files.forEach((file, fileIndex) => {
        formData.append(`file${fileIndex}`, file);
      });
      formData.append(
        'metadata',
        JSON.stringify({
          docName: uploadDoc.getName(),
          auth: cloud.auth,
          domain: cloud.domain,
        }),
      );
      setIsUploading(true);
      fetch(`http${useSSL ? 's' : ''}://${authority}/upload`, {
        method: 'POST',
        body: formData,
      })
        .then(res => {
          setIsUploading(false);
          return res.json();
        })
        .then(resp => {
          onValue([...filesValue, ...resp]);
        })
        .catch(err => {
          setIsUploading(false);
          console.error(err);
        });
    },
    [
      authority,
      cloud.domain,
      cloud.auth,
      filesValue,
      useSSL,
      uploadDoc,
      onValue,
    ],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const fadedColor = opacify(theme.colorForeground, 0.8);
  return (
    <React.Fragment>
      <div {...getRootProps()} style={{ cursor: 'pointer' }}>
        <View
          style={{
            borderColor: opacify(theme.colorPrimary, 0.6),
            borderRadius: 4,
            borderStyle: isDragActive ? 'solid' : 'dotted',
            backgroundColor: isDragActive ? '#eef' : null,
            borderWidth: 3,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            theme={{
              fontSize: 14,
              colorForeground: opacify(theme.colorPrimary, 0.5),
            }}
          >
            {label}
          </Text>
          <input {...getInputProps()} />
          {isUploading && <Text>Uploading..</Text>}
          {isDragActive ? (
            <Text center theme={{ colorForeground: fadedColor }}>
              drop now
            </Text>
          ) : (
            <Text center theme={{ colorForeground: fadedColor }}>
              drop files here, or click to upload files.
            </Text>
          )}
        </View>
      </div>

      {filesValue.map((file, fileIndex) => (
        <Stack horizontal key={fileIndex}>
          <Text>{file.fileName}</Text>
          <Button
            onPress={() => {
              onValue(filesValue.filter(f => f !== file));
            }}
            title="x"
          />
        </Stack>
      ))}
    </React.Fragment>
  );
}
