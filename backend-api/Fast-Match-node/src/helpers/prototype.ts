import { Types } from "mongoose";

String.prototype.parseToObjectId = function (this: string) {
    return new Types.ObjectId(this)
}

Array.prototype.parseToString = function (this: Types.ObjectId[]) {
    return this.map(i => i.toString());
}

Array.prototype.parseToObjectId = function (this: string[]) {
    return this.map(i => new Types.ObjectId(i));
}