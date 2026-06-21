import { User, UserInterface } from "@models/user"
import { Types } from "mongoose"

class AuthRepository {

    async checkuser(email: string) {
        const exist = await User.findOne({ email: email.toLowerCase() }).lean() as any
        return exist
    }

    async checkUserByEmailOrPhone(identifier: string) {
        const exist = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        }).lean() as any
        return exist
    }

    async findUserWithFields(data: any) {
        const exist = await User.findOne(data).lean() as any
        return exist
    }

    async getUserDetails(_id: Types.ObjectId) {
        const user = await User.findOne({ _id }).select('-password -forgotToken -otp').lean();
        return user || null;
    }

    async updateUser(_id: any, updatefields: any) {
        await User.updateOne({ _id }, { $set: updatefields })
    }

    async deleteUser(_id: Types.ObjectId) {
        await User.deleteOne({ _id });
    }

    async findCustomAndUpdateUser(findBy: any, updatefields: any) {
        await User.updateOne(findBy, updatefields)
    }

    async findCustomAndUpdateUserWithDoc(findBy: any, updatefields: any) {
        const user = await User.findOneAndUpdate(findBy, updatefields, { new: true }).lean() as any
        return user
    }

    async createUser(data: any) {
        const user = new User(data)
        await user.save()
        return user
    }

    async upsertUser(data: any) {
        const { email } = data;
        const user = await User.findOneAndUpdate(
            { email },
            { $set: data },
            { new: true, upsert: true }
        );

        return user;
    }

}

export default new AuthRepository()