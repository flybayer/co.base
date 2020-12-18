import styled from "@emotion/styled";
import { ReactElement, useEffect, useRef, useState } from "react";

const HeroTerms = [
  ["Beautiful", "Lightweight", "Structured"],
  ["Data", "Config", "Content"],
  ["Hosting", "Dashboard", "API"],
];
const initFocused = [2, 2, 1];

function arraysMatch<T>(a: T[], b: T[]): boolean {
  let i = 0;
  while (i < b.length && i < a.length) {
    if (a[i] !== b[i]) return false;
    i += 1;
  }
  return true;
}

const headerStyles = {
  fontFamily: "'Fira Sans', Helvetica, sans-serif",
  fontSize: 92,
  lineHeight: 1.1,
  margin: 0,
};

function TermFocusableGroup({ termSet, focused }: { termSet: string[]; focused: number }) {
  return (
    <div style={{ display: "flex" }}>
      {termSet.map((term, termI) => {
        return (
          <h1 style={headerStyles} key={termI} className={focused === termI ? "focused" : ""}>
            {term}
          </h1>
        );
      })}
    </div>
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
        return <TermFocusableGroup key={termSetI} termSet={termSet} focused={focused[termSetI]} />;
      })}
    </div>
  );
}
