export default function formatTime(timeStamp) {
  const t = new Date(timeStamp);
  return t.toLocaleString();
}
