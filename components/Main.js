import styled from "@emotion/styled";

const Outer = styled.div({
  margin: "0 auto",
  maxWidth: 1280,
});

const Inner = styled.div({
  // borderLeftWidth: 1,
  // borderRightWidth: 1,
  borderLeft: "1px solid #ccc",
  borderRight: "1px solid #ccc",
  // borderColor: "green",/
  margin: "0 40",
});

function Main({ children }) {
  return (
    <Outer>
      <Inner>{children}</Inner>
    </Outer>
  );
}

export default Main;
