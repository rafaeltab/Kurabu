let CLIENT_ID = process.env.CLIENT_ID || "noenv";
let CLIENT_SECRET = process.env.CLIENT_SECRET || "noenv";
let EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || "kurabu.moe";

const ERROR_STATUS = "error";
const SUCCESS_STATUS = "success";

function reload(): void {
	CLIENT_ID = process.env.CLIENT_ID || "noenv";
	CLIENT_SECRET = process.env.CLIENT_SECRET || "noenv";
	EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || "kurabu.moe";
}

export { CLIENT_ID, CLIENT_SECRET, EMAIL_DOMAIN, ERROR_STATUS, SUCCESS_STATUS, reload };
