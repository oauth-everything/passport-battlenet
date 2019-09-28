import { Region } from "./Region";

export function getBaseUriForRegion(region: Region): string {

    const regionString = region.toLowerCase();

    if(regionString === Region.CHINA) {
        return "https://www.battlenet.com.cn";
    }
    else {
        return `https://${regionString}.battle.net`;
    }

}
