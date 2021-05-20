import { Media, ListPagination } from "../../../helpers/BasicTypes";
import { IWebRequestResult } from "../../IWebRequest";

export class AnimeSearchWebRequestResult extends IWebRequestResult {
	search!: ListPagination<Media>;
}
