import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { ReactElement } from "react";
import { AccountPage } from "../../lib/components/AccountPage";
import { database } from "../../lib/data/database";
import { Button } from "@chakra-ui/core";
import { CloseIcon } from "@chakra-ui/icons";
import { MainSection } from "../../lib/components/CommonViews";
import { handleAsync } from "../../lib/data/handleAsync";
import { api } from "../../lib/server/api";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const devices = await database.deviceToken.findMany({
    where: { user: { id: verifiedUser.id }, approveTime: { not: null } },
    select: { name: true, approveTime: true, id: true, type: true },
  });
  return {
    props: {
      user: verifiedUser,
      devices: devices.map((d) => ({
        ...d,
        approveTime: d.approveTime ? d.approveTime.toISOString() : null,
      })),
    },
  };
};

type Device = {
  id: number;
  name: string;
  type: string;
  approveTime: string;
};

function DeviceRow({ device }: { device: Device }): ReactElement {
  return (
    <h1>
      {device.type} - {device.name} - {device.approveTime}
      <Button
        colorScheme="red"
        onClick={() => {
          handleAsync(api("device-destroy", { id: device.id }));
        }}
      >
        <CloseIcon />
      </Button>
    </h1>
  );
}

export default function AccountDevicesPage({ user, devices }: { user: APIUser; devices: Array<Device> }): ReactElement {
  return (
    <AccountPage tab="devices" user={user}>
      <MainSection title="Personal Sessions & Devices">
        {devices.map((device) => (
          <DeviceRow device={device} key={device.id} />
        ))}
      </MainSection>
    </AccountPage>
  );
}
