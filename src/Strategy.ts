import { Strategy as OAuth2Strategy, StrategyOptions as OAuth2StrategyOptions, InternalOAuthError } from "passport-oauth2";
import { Profile as OAuth2Profile } from "@oauth-everything/profile";
import {
    ExtendableStrategyOptions,
    ExtendableStrategyOptionsWithRequest,
    OAuth2VerifyCallback,
    OAuth2VerifyFunction,
    OAuth2VerifyFunctionWithRequest,
    OAuth2VerifyFunctionWithResults,
    OAuth2VerifyFunctionWithRequestAndResults
} from "@oauth-everything/oauth2-types";

import { UserInfo } from "./ApiData/UserInfo";
import { Region } from "./Region";
import { getBaseUriForRegion } from "./Util";

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface OptionsMixin {
    region: Region;
}

export type Profile = OAuth2Profile<UserInfo>;
export type StrategyOptions = ExtendableStrategyOptions<OptionsMixin>;
export type StrategyOptionsWithRequest = ExtendableStrategyOptionsWithRequest<OptionsMixin>;
export type VerifyCallback<TUser = object, TInfo = object> = OAuth2VerifyCallback<TUser, TInfo>;
export type VerifyFunction<TUser, TInfo> = OAuth2VerifyFunction<Profile, TUser, TInfo>;
export type VerifyFunctionWithRequest<TUser, TInfo> = OAuth2VerifyFunctionWithRequest<Profile, TUser, TInfo>;
export type VerifyFunctionWithResults<TUser, TInfo> = OAuth2VerifyFunctionWithResults<TokenResponse, Profile, TUser, TInfo>;
export type VerifyFunctionWithRequestAndResults<TUser, TInfo> = OAuth2VerifyFunctionWithRequestAndResults<TokenResponse, Profile, TUser, TInfo>;

export class Strategy<TUser = object, TInfo = object> extends OAuth2Strategy {

    public name: "battlenet";

    private baseUrl: string;

    constructor(
        options: StrategyOptions,
        verify: VerifyFunction<TUser, TInfo>
            | VerifyFunctionWithResults<TUser, TInfo>
    )

    constructor(
        options: StrategyOptionsWithRequest,
        verify: VerifyFunctionWithRequest<TUser, TInfo>
            | VerifyFunctionWithRequestAndResults<TUser, TInfo>
    )

    constructor(
        options: StrategyOptions
            | StrategyOptionsWithRequest,
        verify: VerifyFunction<TUser, TInfo>
            | VerifyFunctionWithResults<TUser, TInfo>
            | VerifyFunctionWithRequest<TUser, TInfo>
            | VerifyFunctionWithRequestAndResults<TUser, TInfo>
    ) {

        const region = options.region || Region.UNITED_STATES;
        const baseUrl = getBaseUriForRegion(region);

        super(
            {
                authorizationURL: `${baseUrl}/oauth/authorize`,
                tokenURL: `${baseUrl}/oauth/token`,
                ...options
            } as OAuth2StrategyOptions,
            verify as VerifyFunction<TUser, TInfo>
        );

        this.name = "battlenet";
        this.baseUrl = baseUrl;

    }

    public userProfile(accessToken: string, done: (err?: Error | null, profile?: Profile | null) => void): void {

        this._oauth2.useAuthorizationHeaderforGET(true);
        this._oauth2.get(`${this.baseUrl}/oauth/userinfo`, accessToken, (error, result) => {

            if (error) return done(new InternalOAuthError("Failed to fetch user profile", error));

            let json: UserInfo;

            try {
                json = JSON.parse(result as string) as UserInfo;
            }
            catch (parseError) {
                return done(new InternalOAuthError("Failed to parse user profile", parseError));
            }

            done(null, {
                provider: this.name,
                id: json.sub,
                username: json.battletag,
                _raw: result as string,
                _json: json
            });

        });

    }

}
