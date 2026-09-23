import { createConfig, http } from "wagmi";
import { monadMainnet } from "./chains";

export const config = createConfig({
  chains: [monadMainnet],
  transports: {
    [monadMainnet.id]: http(),
  },
});
