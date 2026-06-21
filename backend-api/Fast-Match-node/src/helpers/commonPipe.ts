import { Types } from "mongoose"
import appConfig from "../config/config"

export const offsetPipe = (offset: number) => {
    return { $skip: offset }
}

export const limitPipe = (limit: number) => {
    return { $limit: limit }
}

export const sortPipe = (key: string, order: number) => {
    const sort: { [key: string]: any } = { [key]: order };
    return { $sort: sort }
}

export const multiSortPipe = (sorts: { [key: string]: any }) => {
    return { $sort: sorts }
}

export const unwindPipe = (key: string) => {
    return {
        $unwind: {
            path: key,
            preserveNullAndEmptyArrays: true
        }
    }
}

export const unsetPipe = (key: string) => {
    return { $unset: key }
}

export const multiUnsetPipe = (key: string[]) => {
    return { $unset: key }
}

export const objectIdMatchForUser = (_id: Types.ObjectId) => {
    return {
        $match: { _id, deletedAt: null }
    }
}

export const objectIdNotMatch = (_id: Types.ObjectId) => {
    return {
        $match: { _id: { $ne: _id } }
    }
}

export const creatorMatch = (creator: Types.ObjectId) => {
    return {
        $match: { 'creator': creator, deactivate: false }
    }
}

export const blockMatch = () => {
    return {
        $match: { 'block': false }
    }
}

export const deleteMatch = () => {
    return {
        $match: { deletedAt: null },
    }
}

export const facetPipe = (offset: number, limit: number) => {
    return {
        $facet: {
            data: [{ $skip: offset }, { $limit: limit }],
            totalCount: [{ $count: 'count' }]
        }
    }
}