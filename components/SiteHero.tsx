import styled from "@emotion/styled";
import { ReactElement, useEffect, useState } from "react";

const HeroTerms = [
  ["Beautiful", "Lightweight", "Structured"],
  ["Data", "Config", "Content"],
  ["Hosting", "Dashboard", "API"],
];
const HeroOffset = [
  [0, "-40%", "-91%"],
  [0, "-20%", "-47%"],
  [0, "-34%", "-82%"],
];
const initFocused = [2, 2, 1];
// const initFocused = [1, 1, 1];
// const initFocused = [2, 2, 2];

function arraysMatch<T>(a: T[], b: T[]): boolean {
  let i = 0;
  while (i < b.length && i < a.length) {
    if (a[i] !== b[i]) return false;
    i += 1;
  }
  return true;
}

const headerStyles = {};

const FocusableGroup = styled.div`
  display: flex;
  position: relative;
  transition: all 0.5s;
`;

const TermTitle = styled.span`
  color: #0000;
  font-family: "Fira Sans", Helvetica, sans-serif;
  font-size: 92px;
  line-height: 1.1;
  // margin: 0;
  // transition: color 1s;
  // left: 0px;
  // transition: margin 1s;
  transition: all 0.5s;
  position: relative;
`;

function TermFocusableGroup({
  termSet,
  termSetIndex,
  focused,
}: {
  termSet: string[];
  focused: number;
  termSetIndex: number;
}) {
  return (
    <FocusableGroup style={{ left: HeroOffset[termSetIndex][focused] }}>
      {termSet.map((term, termI) => {
        return (
          <TermTitle
            style={focused === termI ? { color: "black" } : {}}
            key={termI}
            className={focused === termI ? "focused" : ""}
          >
            {term}
          </TermTitle>
        );
      })}
    </FocusableGroup>
  );
}
export function SiteHero(): ReactElement {
  const [focused, setFocused] = useState(initFocused);
  useEffect(() => {
    const to = setTimeout(() => {
      const newFocused = [...focused];
      while (arraysMatch(newFocused, focused)) {
        newFocused[Math.floor(Math.random() * 3)] = Math.floor(Math.random() * 3);
      }
      setFocused(newFocused);
    }, 2500);
    return () => {
      clearTimeout(to);
    };
  }, [focused]);
  return (
    <div>
      {HeroTerms.map((termSet, termSetI) => {
        return (
          <TermFocusableGroup key={termSetI} termSet={termSet} termSetIndex={termSetI} focused={focused[termSetI]} />
        );
      })}
    </div>
  );
}
