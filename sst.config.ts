import { SSTConfig } from "sst";
import { STACK } from "./stacks/Stack";

export default {
  config(_input) {
    return {
      name: "better-sst",
      region: "eu-north-1",
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      // downside of using a 3rd party tool?
      // -- no support for node20 yet? :(
      runtime: "nodejs18.x",
      timeout: 30,
      memorySize: 512,
    });

    app.stack(STACK);
  }
} satisfies SSTConfig;
