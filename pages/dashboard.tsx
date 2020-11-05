import {
  Button,
  Icon,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/core";
import styled from "@emotion/styled";
import { useReducer, useState } from "react";
import { PlusSquareIcon, AddIcon, SettingsIcon } from "@chakra-ui/icons";
import { getRandomLetters } from "../api-utils/getRandomLetters";
import { ChannelList } from "twilio/lib/rest/preview/trusted_comms/brandedChannel/channel";

type TreeState = {
  name: string;
  key: string;
  children?: Array<TreeState>;
};

type NavigationFrame =
  | { type: "site-settings" }
  | { type: "new-record"; keyAddress: Array<string> }
  | { type: "record"; keyAddress: Array<string> };

type DashState = {
  siteName: string;
  nav: Array<NavigationFrame>;
  tree: Array<TreeState>;
};

type DashAction =
  | { type: "GoSiteSettings" }
  | { type: "GoNewRecord"; keyAddress?: Array<string> }
  | { type: "GoRecord"; keyAddress: Array<string> }
  | { type: "AddRecord"; name: string; keyAddress: Array<string> }
  | { type: "SetSiteName"; value: string };

type DashDispatcher = (action: DashAction) => void;

const initState: DashState = {
  siteName: "Um",
  nav: [],
  tree: [],
};

function addToAddress(
  tree: TreeState[],
  item: TreeState,
  address: string[]
): TreeState[] {
  if (address.length === 0) {
    return [...tree, item];
  }
  const index = tree.findIndex((i) => i.key === address[0]);
  if (index === -1) {
    // bad address!
    return tree;
  }
  const child = tree[index];
  if (child.children) {
    const newTree = [...tree];
    newTree[index] = {
      ...child,
      children: addToAddress(child.children, item, address.slice(1)),
    };
    return newTree;
  }
  return tree;
}

function stateReducer(state: DashState, action: DashAction): DashState {
  if (action.type === "GoSiteSettings") {
    return {
      ...state,
      nav: [{ type: "site-settings" }],
    };
  }
  if (action.type === "GoNewRecord") {
    return {
      ...state,
      nav: [{ type: "new-record", keyAddress: action.keyAddress || [] }],
    };
  }
  if (action.type === "GoRecord") {
    return {
      ...state,
      nav: [...state.nav, { type: "record", keyAddress: action.keyAddress }],
    };
  }
  if (action.type === "SetSiteName") {
    return {
      ...state,
      siteName: action.value,
    };
  }
  if (action.type === "AddRecord") {
    const newKey = getRandomLetters(5);
    return {
      ...state,
      tree: addToAddress(
        state.tree,
        { name: action.name, key: newKey },
        action.keyAddress
      ),
      nav: [
        ...state.nav.filter((n) => n.type !== "new-record"),
        { type: "record", keyAddress: [...action.keyAddress, newKey] },
      ],
    };
  }
  return state;
}

function AvenLogo() {
  return (
    <svg width={226} height={50} viewBox="0 0 4520 1000">
      <title>{"AvenLogoPlain"}</title>
      <defs>
        <linearGradient x1="50%" y1="3.243%" x2="50%" y2="100%" id="prefix__a">
          <stop stopColor="#fff" offset="0%" />
          <stop stopColor="#fff" offset="100%" />
        </linearGradient>
      </defs>
      <g fill="url(#prefix__a)" fillRule="evenodd">
        <path d="M3520 0h-300l-100 200h-390l-100 200h390l-99.761 199.999L2530 600l-100 200h390l-100 200h300zM2180 0l-500 1000h300L2480 0zM1000 0H700l500 1000h300zM1580 500l200-400h-400zM3920 500l200-400h-400zM3620 500l-200 400h400zM600 500L400 900h400zM.07 0v1000l500-1000zM4520 1000V0l-500 1000z" />
      </g>
    </svg>
  );
}

const PaneContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  margin: 16px;
  min-width: 360px;
  border: 1px solid #ddd;
`;

const PaneHeader = styled.div`
  border-bottom: 1px solid #ddd;
  padding: 12px;
`;

const MainSection = styled.div`
  display: flex;
  flex-grow: 1;
  background: #efefef;
`;

const DashboardContainer = styled.div`
  background: #338;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px;
`;
const SiteTitle = styled.h1`
  font-size: 48px;
`;
const PaneTitle = styled.h2`
  font-size: 38px;
`;

function RecordItem({
  keyAddress,
  item,
  dispatch,
}: {
  item: TreeState;
  keyAddress: Array<string>;
  dispatch: DashDispatcher;
}) {
  return <div>{item.name}</div>;
}

function RecordItems({
  items,
  keyAddress,
  dispatch,
}: {
  items: Array<TreeState>;
  keyAddress: Array<string>;
  dispatch: DashDispatcher;
}) {
  return (
    <>
      {items.map((item) => (
        <RecordItem
          key={item.key}
          keyAddress={[...keyAddress, item.key]}
          item={item}
          dispatch={dispatch}
        />
      ))}
    </>
  );
}

function MainPane({
  state,
  dispatch,
}: {
  state: DashState;
  dispatch: DashDispatcher;
}) {
  return (
    <PaneContainer>
      <PaneHeader>
        <SiteTitle>{state.siteName}</SiteTitle>
        <Button
          variant="ghost"
          onClick={() => {
            dispatch({ type: "GoSiteSettings" });
          }}
        >
          <SettingsIcon />
        </Button>

        <Menu>
          <MenuButton as={Button} variant="ghost">
            <AddIcon />
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => {
                dispatch({ type: "GoNewRecord" });
              }}
            >
              Record
            </MenuItem>
            <MenuItem>Record Set</MenuItem>
            <MenuItem>Folder</MenuItem>
          </MenuList>
        </Menu>
      </PaneHeader>
      <RecordItems items={state.tree} keyAddress={[]} dispatch={dispatch} />
    </PaneContainer>
  );
}
function getRecord(
  tree: TreeState[],
  keyAddress: string[]
): undefined | TreeState {
  let validList: null | TreeState[] = tree;
  let matchedRecord = undefined;
  for (let key in keyAddress) {
    const n: TreeState | undefined = validList?.find((i) => i.key === key);
    if (n) {
      validList = n.children || null;
      matchedRecord = n;
    } else {
      matchedRecord = undefined;
    }
  }
  return matchedRecord;
}
function RecordPane({
  state,
  dispatch,
  keyAddress,
}: {
  state: DashState;
  dispatch: DashDispatcher;
  keyAddress: Array<string>;
}) {
  const record = getRecord(state.tree, keyAddress);

  return (
    <PaneContainer>
      <PaneHeader>
        <PaneTitle>{record?.name || "Not found"}</PaneTitle>
        {record && (
          <Button
            variant="ghost"
            onClick={() => {
              dispatch({ type: "GoSiteSettings" });
            }}
          >
            <SettingsIcon />
          </Button>
        )}

        {record && (
          <Menu>
            <MenuButton as={Button} variant="ghost">
              <AddIcon />
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => {
                  dispatch({ type: "GoNewRecord", keyAddress });
                }}
              >
                Record
              </MenuItem>
              <MenuItem>Record Set</MenuItem>
              <MenuItem>Folder</MenuItem>
            </MenuList>
          </Menu>
        )}
      </PaneHeader>
      <RecordItems
        items={record?.children || []}
        keyAddress={[]}
        dispatch={dispatch}
      />
    </PaneContainer>
  );
}

function NewRecordPane({
  state,
  dispatch,
  keyAddress,
}: {
  state: DashState;
  dispatch: DashDispatcher;
  keyAddress: Array<string>;
}) {
  const [newName, setNewName] = useState("");
  return (
    <PaneContainer>
      <PaneHeader>
        <PaneTitle>New Record</PaneTitle>
      </PaneHeader>
      <Input
        value={newName}
        onChange={(e: any) => {
          setNewName(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          dispatch({ type: "AddRecord", name: newName, keyAddress });
        }}
      >
        Create
      </Button>
    </PaneContainer>
  );
}

function SiteSettingsPane({
  dispatch,
  state,
}: {
  dispatch: DashDispatcher;
  state: DashState;
}) {
  return (
    <PaneContainer>
      <PaneHeader>
        <PaneTitle>Site Settings</PaneTitle>
      </PaneHeader>
      <Input
        value={state.siteName}
        onChange={(e: any) => {
          dispatch({ type: "SetSiteName", value: e.target.value });
        }}
      />
    </PaneContainer>
  );
}

function Header() {
  return (
    <HeaderContainer>
      <AvenLogo />
    </HeaderContainer>
  );
}

export default function Dashboard() {
  const [state, dispatch] = useReducer(stateReducer, initState);
  return (
    <DashboardContainer>
      {/* <Header /> */}
      <MainSection>
        <MainPane state={state} dispatch={dispatch} />
        {state.nav?.map((paneSpec) => {
          if (paneSpec.type === "new-record")
            return (
              <NewRecordPane
                state={state}
                dispatch={dispatch}
                keyAddress={paneSpec.keyAddress || []}
              />
            );
          if (paneSpec.type === "site-settings")
            return <SiteSettingsPane state={state} dispatch={dispatch} />;
          if (paneSpec.type === "record")
            return (
              <RecordPane
                state={state}
                dispatch={dispatch}
                keyAddress={paneSpec.keyAddress}
              />
            );
        })}
      </MainSection>
    </DashboardContainer>
  );
}
