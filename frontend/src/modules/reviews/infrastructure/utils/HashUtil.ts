import * as crypto from "crypto";

export class HashUtil {
    public static hash(val: string | undefined | null): string | null {
        if (!val) return null;
        return crypto.createHash("sha256").update(val).digest("hex");
    }
}
