import { existsSync, mkdirSync } from "fs"
import appConfig from "../config"

export const serverSetupManager = () => {
    const checkFolder = existsSync(`${appConfig.publicFolder}`)
    if (!checkFolder) {
        mkdirSync(`${appConfig.publicFolder}`, { recursive: true })
    }
    for (let i of appConfig.folders) {
        if (!existsSync(`${i}`)) mkdirSync(`${i}`, { recursive: true })
    }
}