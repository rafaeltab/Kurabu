import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { Controller, Get } from "@overnightjs/core";
import { winstonLogger } from "@kurabu/logging";
import * as Options from "./AuthedControllerOptions";
import { PendingUserCommandHandler } from "#commands/Users/Pending/PendingUserCommandHandler";
import { param, ParamPos, ParamType } from "#decorators/ParamDecorator";
import requestHandlerDecorator from "#decorators/RequestHandlerDecorator";
import state from "#decorators/StateDecorator";
import ParameterError from "#errors/Parameter/ParameterError";

@Controller(Options.controllerPath)
@injectable()
export class AuthedController {
    constructor(private _pendingUserCommand: PendingUserCommandHandler) {}

    private static async errorCallback(
        req: Request,
        res: Response,
        arg: Options.Params,
        success: boolean
    ) {
        if (!success) {
            await arg.user.destroy();
        }
    }

    private static async codeCallback(
        req: Request,
        res: Response,
        arg: Options.Params,
        success: boolean
    ) {
        if (!success) {
            await arg.user.destroy();
        }
    }

    @Get(Options.controllerName)
    @requestHandlerDecorator()
    @state()
    @param(
        "error",
        ParamType.string,
        true,
        ParamPos.either,
        AuthedController.errorCallback.bind(this)
    )
    @param(
        "code",
        ParamType.string,
        false,
        ParamPos.either,
        AuthedController.codeCallback.bind(this)
    )
    private async get(req: Request, res: Response, arg: Options.Params) {
        const codeRe = /[0-9a-z]{700,1300}/;
        if (!codeRe.exec(arg.code)) {
            winstonLogger.warn("Code parameter was of incorrect format in request to /authed");

            await arg.user.destroy();
            throw new ParameterError("There is a problem with one of your parameters");
        }

        const ourdomain = `${req.protocol}://${req.hostname}`;
        const result = await this._pendingUserCommand.handle({
            code: arg.code,
			isJwt: arg.isJwt,
            ourdomain,
			uuid: arg.state,
        });

        res.redirect(result.url);
    }
}
