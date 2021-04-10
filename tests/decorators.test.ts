import { ParamDecorator } from "./decorators/param.test";
import { requestHandler } from "./decorators/requestHandler.test";
import { State } from "./decorators/state.test";

describe("decorators", () => {
	ParamDecorator();
	requestHandler();
	State();
});
