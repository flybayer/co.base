import styled from "@emotion/styled";
export const InnerWidth = styled.div`
  max-width: 950px;
  margin: 0 auto;
  padding: 0 25px;
  display: flex;
  justify-content: space-between;
`;
export const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
`;

export const ObjectContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 20px;
  border: 2px solid green;
`;
export const ArrayContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 20px;
  border: 2px solid blue;
`;
export const SchemaContainer = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
`;
export const Label = styled.h2`
  flex-grow: 1;
  font-size: 22px;
`;
export const StringContainer = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 20px;
  border: 2px solid #eee;
  justify-content: space-between;
  margin: 10px 0;
`;
export const BooleanContainer = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 20px;
  border: 2px solid #eee;
  justify-content: space-between;
  margin: 10px 0;
`;
export const NumberContainer = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 20px;
  border: 2px solid #eee;
  justify-content: space-between;
  margin: 10px 0;
`;

const MainSectionContainer = styled.div`
  background: white;
  border-radius: 5px;
  margin: 24px 0 0;
  padding-top: 3px;
`;
const MainSectionInnerBorder = styled.div`
  border-top: 1px solid #ddd;
  padding: 20px;
`;
const MainSectionInner = styled.div`
  padding: 20px;
`;
const MainSectionTitle = styled.h2`
  font-size: 22px;
  margin: 10px 16px;
`;
export const CenterButtonRow = styled.div`
  display: flex;
  justify-content: center;
`;

export function MainSection({
  title,
  children,
}: React.PropsWithChildren<{ title?: string }>) {
  if (title == null) {
    return (
      <MainSectionContainer>
        <MainSectionInner>{children}</MainSectionInner>
      </MainSectionContainer>
    );
  }
  return (
    <MainSectionContainer>
      <MainSectionTitle>{title}</MainSectionTitle>
      <MainSectionInnerBorder>{children}</MainSectionInnerBorder>
    </MainSectionContainer>
  );
}
