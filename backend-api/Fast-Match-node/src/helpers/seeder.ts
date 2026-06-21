import userRepos from "@repository/user.repo";
import appConfig from "@config/config";
import { bcryptManager } from "./bcrypt";

const bcrypt = new bcryptManager();

export const seedAdmin = async () => {
    try {
        const adminEmail = appConfig.adminEmail;
        const exists = await userRepos.checkuser(adminEmail);

        if (!exists) {
            console.log("🌱 Seeding Admin...");
            const hashedPassword = bcrypt.hashPassword(appConfig.adminPassword);
            await userRepos.createUser({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                fullName: 'Super Admin',
                displayName: 'Admin',
                isPremium: 'premium'
            });
            console.log("✨ Admin seeded successfully!");
        } else {
            if (exists.role !== 'admin') {
                await userRepos.updateUser(exists._id, { role: 'admin' });
                console.log("🛠 Updated existing user to Admin role.");
            }
            console.log("✅ Admin already exists.");
        }
    } catch (error) {
        console.error("❌ Error seeding Admin:", error);
    }
};
