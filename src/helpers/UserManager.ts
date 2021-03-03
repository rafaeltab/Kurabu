import { getPKCE, getUUID, isUUID, makeVerifCode } from '../helpers/randomCodes';
import { CLIENT_ID } from '../helpers/GLOBALVARS';
import { GetToken } from '../MALWrapper/Authentication';
import { tokenResponse, ResponseMessage } from '../MALWrapper/BasicTypes';
import { Database } from './database/Database';
import { Logger } from '@overnightjs/logger';
import { Request, Response } from 'express';
import * as MailHelper from '../helpers/MailHelper';
import MissingParameterError from '../errors/Parameter/MissingParameterError';
import MalformedParameterError from '../errors/Parameter/MalformedParameterError';
import MissingStateError from '../errors/Authentication/MissingStateError';
import StateStatusError from '../errors/Authentication/StateStatusError';
import PasswordStrengthError from '../errors/Parameter/PasswordStrengthError';
import MailUsedError from '../errors/Authentication/MailUsedError';
import AttemptError from '../errors/Authentication/AttemptError';
import IncorrectCodeError from '../errors/Authentication/IncorrectCodeError';
import GeneralError from '../errors/GeneralError';
import { autoInjectable, injectable, singleton } from 'tsyringe';
import { ICommandHandler } from '../commands/ICommand';
import { CreateUserCommand } from '../commands/Users/Create/CreateUserCommand';
import { CreateUserCommandResult } from '../commands/Users/Create/CreateUserCommandResult';
import { UpdateUserTokensCommand } from '../commands/Users/UpdateTokens/UpdateUserTokensCommand';
import { UpdateUserTokensCommandResult } from '../commands/Users/UpdateTokens/UpdateUserTokensCommandResult';
import { IQueryHandler } from '../queries/IQuery';
import { UserEmailUsedQuery } from '../queries/Users/EmailUsed/UserEmailUsedQuery';
import { UserEmailUsedQueryResult } from '../queries/Users/EmailUsed/UserEmailUsedQueryResult';
import { UserLoginQuery } from '../queries/Users/Login/UserLoginQuery';
import { UserLoginQueryResult } from '../queries/Users/Login/USerLoginQueryResult';
import { UserTokensFromUUIDQuery } from '../queries/Users/TokensFromUUID/UserTokensFromUUIDQuery';
import { UserTokensFromUUIDQueryResult } from '../queries/Users/TokensFromUUID/UserTokensFromUUIDQueryResult';
import { CreateUserCommandHandler } from '../commands/Users/Create/CreateUserCommandHandler';
import { UpdateUserTokensCommandHandler } from '../commands/Users/UpdateTokens/UpdateUserTokensCommandHandler';
import { UserEmailUsedQueryHandler } from '../queries/Users/EmailUsed/UserEmailUsedQueryHandler';
import { UserLoginQueryHandler } from '../queries/Users/Login/UserLoginQueryHandler';
import { UserTokensFromUUIDQueryHandler } from '../queries/Users/TokensFromUUID/UserTokensFromUUIDQueryHandler';

/*
Manage all user data
*/
//#region types
type DictData = {
    token: string,
    RefreshToken: string,
    email: string
}

type RegisterData = {
    email: string,
    pass: string,
    verifier: string,
    redirect?: string
}

type VerifData = {
    email: string,
    pass: string,
    code: string,
    attempt: number
}

type DictEntry = {
    state: "done" | "pending" | "errored" | "canceled" | "verif",
    data?: DictData | RegisterData | VerifData
}
//#endregion types
@singleton()
export class UserManager {
    private codeDict: Map<string, DictEntry>;

    private _createUserCommand: CreateUserCommandHandler;
    private _updateUserTokensCommand: UpdateUserTokensCommandHandler;
    private _userEmailUsedQuery: UserEmailUsedQueryHandler;
    private _userLoginQuery: UserLoginQueryHandler;
    private _userTokensFromUUIDQuery: UserTokensFromUUIDQueryHandler;

    constructor(
        createUserCommand: CreateUserCommandHandler,
        updateUserTokensCommand: UpdateUserTokensCommandHandler,
        userEmailUsedQuery: UserEmailUsedQueryHandler,
        userLoginQuery: UserLoginQueryHandler,
        userTokensFromUUIDQuery: UserTokensFromUUIDQueryHandler
    ) {
        this.codeDict = new Map<string, DictEntry>();

        this._createUserCommand = createUserCommand;
        this._updateUserTokensCommand = updateUserTokensCommand;
        this._userEmailUsedQuery = userEmailUsedQuery;
        this._userLoginQuery = userLoginQuery;
        this._userTokensFromUUIDQuery = userTokensFromUUIDQuery;
    }

    //#region functions
    /** Log the codeDict */
    public LogDict() {
        let strRep = "";
        this.codeDict.forEach((value, key) => {
            strRep += `${key}: ${JSON.stringify(value)}\n`;
        });
        Logger.Info(strRep);
    }

    /** Start the registration, returns url for authentication */
    public async StartRegister(email: string, password: string): Promise<string> {
        //Check format for email and password
        const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!email.match(emailReg)) {
            throw new MalformedParameterError("Email incorrect format");
        }

        const passReg = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)^[a-zA-Z\d\W]{8,30}$/;
        if (!password.match(passReg)) {
            throw new PasswordStrengthError("Password incorrect format");
        }

        //check if email exists in db
        if ((await this._userEmailUsedQuery.handle({ email })).emailIsUsed) throw new MailUsedError("Email in use");

        //Create a uuid and code verifier
        let uuid = getUUID();
        let code = makeVerifCode();
        //create a dict entry with state pendign and the email, password and verifier
        let dictEntry: DictEntry = {
            state: "verif",
            data: {
                email: email,
                pass: password,
                code: code,
                attempt: 0
            }
        }

        MailHelper.SendHtml(email, "Verification imal", `<b>Your verification code is ${code}</b>`, "verification@imal.ml");

        //add the entry to the dict with the uuid
        this.codeDict.set(uuid, dictEntry);
        setTimeout(() => {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);
            if (dictEntry.state == "verif") {
                this.codeDict.delete(uuid);
            }
        }, 10 * 60 * 1000);
        //return the authentication url
        return uuid;
    }

    public CancelRegister(uuid: string) {
        if (this.codeDict.has(uuid)) {
            let current = this.codeDict.get(uuid);
            if (current?.state == "verif") {
                this.SetCanceled(uuid);
                return;
            } else {
                throw new StateStatusError("State had wrong status during cancel");
            }
        } else {
            throw new MissingStateError("State missing during cancel");
        }
    }

    public async DoVerif(uuid: string, code: string, ourdomain: string, redirect?: string): Promise<string> {
        if (!this.codeDict.has(uuid)) throw new MissingStateError("verif uuid doesn't exist");

        let dictVal = <DictEntry>this.codeDict.get(uuid);
        if (dictVal.state != "verif") throw new StateStatusError("uuid is not a verif uuid")

        let verifVal: { state: "verif", data: VerifData } = (dictVal as { state: "verif", data: VerifData });
        if (code != verifVal.data.code) {
            verifVal.data.attempt++;

            if (verifVal.data.attempt > 4) {
                this.codeDict.delete(uuid);
                throw new AttemptError("Too many attempts");
            }
            throw new IncorrectCodeError("Incorrect code");
        }

        let codeVerifier: string = getPKCE(128);

        this.codeDict.delete(uuid);
        let dictEntry: DictEntry = {
            state: "pending",
            data: {
                email: verifVal.data.email,
                pass: verifVal.data.pass,
                verifier: codeVerifier,
                redirect: redirect
            }
        }

        this.codeDict.set(uuid, dictEntry);
        setTimeout(() => {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);
            if (dictEntry.state == "pending") {
                this.codeDict.delete(uuid);
            }
        }, 10 * 60 * 1000);

        return `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&code_challenge=${codeVerifier}&state=${uuid}&redirect_uri=${process.env.LOCALMODE ? "http://localhost:15000/authed" : ourdomain + "/authed"}`;
    }

    /** Check and load state of uuid */
    public async CheckUUID(uuid: string): Promise<"pending" | "done" | "errored" | "canceled" | "verif"> {
        if (this.codeDict.has(uuid)) {
            let entry = <DictEntry>this.codeDict.get(uuid);
            return entry.state;
        }

        var queryResult = await this._userTokensFromUUIDQuery.handle({ uuid: uuid })

        let dictEntry: DictEntry = {
            state: "done",
            data: {
                email: queryResult.email,
                token: queryResult.token,
                RefreshToken: queryResult.refreshtoken
            }
        }
        this.codeDict.set(queryResult.id, dictEntry);
        return "done";
    }

    /** end the registration, add user to database */
    public async DoPending(uuid: string, code: string, ourdomain: string) {
        //check if the uuid exists in the dict
        if (!this.codeDict.has(uuid)) throw new MissingStateError("uuid does not exist yet");

        //get the dict entry and check if the state is pending
        let dictEntry = <DictEntry>this.codeDict.get(uuid);
        if (dictEntry.state != "pending") throw new StateStatusError("uuid is not pending, it is: " + dictEntry.state);

        //get the dict data in the correct type
        let dictData = <RegisterData>dictEntry.data;
        //get the tokens from MAL
        let tokens = await GetToken(code, dictData.verifier, ourdomain);
        //check if we errored while connecting to MAL
        if ((tokens as ResponseMessage).status) {
            let err = (tokens as ResponseMessage);
            if (err.status == "error") {
                throw new GeneralError(err.message);
            }
        }

        //get the token data in correct type
        let tokenData = <tokenResponse>tokens;

        //All good so add user to the database and update codeDict
        await this._createUserCommand.handle({
            uuid: uuid,
            email: dictData.email,
            password: dictData.pass,
            refreshToken: tokenData.refresh_token,
            token: tokenData.access_token
        });

        this.codeDict.set(uuid, {
            state: "done",
            data: {
                token: tokenData.access_token,
                RefreshToken: tokenData.refresh_token,
                email: dictData.email
            }
        });

        if (dictData.redirect) {
            return `${dictData.redirect}${uuid}`;
        }

        //return `imal://${uuid}`;
        return `imal://auth/${uuid}`;
    }

    /** Update tokens in database and codeDict if they are new */
    public async TryUpdateTokens(uuid: string, token: string, refreshtoken: string) {
        //check if the tokens have changed
        let tokens = await this.GetTokensForUUID(uuid);
        if (tokens.token != token || tokens.refreshtoken != refreshtoken) {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);

            let curr = <DictData>dictEntry.data;
            curr.token = token;
            curr.RefreshToken = refreshtoken;

            this.codeDict.set(uuid, { state: dictEntry.state, data: curr });

            //Update token in database
            await this._updateUserTokensCommand.handle({
                refreshtoken: refreshtoken,
                token: token,
                uuid: uuid
            });
        }
    }

    /** Get token associated with uuid */
    public async GetTokensForUUID(uuid: string): Promise<{ token: string, refreshtoken: string }> {
        let state = await this.CheckUUID(uuid);
        if (state == "done") {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);
            let dictData = <DictData>dictEntry.data;
            return {
                token: dictData.token,
                refreshtoken: dictData.RefreshToken
            };
        } else {
            throw new Error("Authentication is not done but " + state);
        }
    }

    /** Do login with an email and password */
    public async Login(email: string, password: string): Promise<string> {

        var queryResult = await this._userLoginQuery.handle({
            email: email,
            password: password
        })

        let dictEntry: DictEntry = {
            state: "done",
            data: {
                email: queryResult.email,
                token: queryResult.token,
                RefreshToken: queryResult.refreshtoken
            }
        }
        this.codeDict.set(queryResult.id, dictEntry);
        return queryResult.id;
    }

    /** Check if state param is set and valid in a request */
    public CheckRequestState(req: Request, res: Response) {
        //state is one of the paramaters
        let query = req.query["state"]?.toString();
        let body = req.body["state"]?.toString();

        let state: string = query ?? body;

        if (!state || state == "") {
            throw new MissingParameterError("Missing required parameter state");
        }

        //state is valid format
        if (!isUUID(state)) {
            throw new MalformedParameterError("State incorrect format");
        }

        this.CheckUUID(state)

        return state;
    }

    /** Set the state for a uuid to errored */
    public SetErrored(uuid: string) {
        this.codeDict.set(uuid, {
            state: "errored"
        });

        setTimeout(() => {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);
            if (dictEntry.state == "errored") {
                this.codeDict.delete(uuid);
            }
        }, 10 * 60 * 1000);
    }

    /** Set the state for a uuid to canceled */
    public SetCanceled(uuid: string) {
        this.codeDict.set(uuid, {
            state: "canceled"
        })

        setTimeout(() => {
            let dictEntry = <DictEntry>this.codeDict.get(uuid);
            if (dictEntry.state == "canceled") {
                this.codeDict.delete(uuid);
            }
        }, 10 * 60 * 1000);
    }
    //#endregion functions

    //#region singleton
    // private static instance: UserManager;
    // /** Initialize codeDict */
    // public constructor() {
    //     this.codeDict = new Map<string, DictEntry>()
    // }
    // public static GetInstance() {
    //     if (!UserManager.instance) {
    //         UserManager.instance = new UserManager();
    //     }
    //     return UserManager.instance;
    // }
    //#endregion singleton
}