import appConfig from "../config/config";

export const randomOtp = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0');

export const isNotNullAndUndefined = (value: any) => value !== undefined && value !== null && value !== '';

export const escapeSpecialCharacter = (text: string) => {
    if (text && typeof text === "string") return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    else return '';
}

export const jsonParse = (data: any) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return false
    }
}

export const paginationData = (totalCount: number = 0, limit: number = appConfig.defaultLimit, offset: number = appConfig.defaultOffset) => {
    let totalPages = Math.ceil(totalCount / limit);
    let currentPage = Math.floor(offset / limit);
    let prevPage = (currentPage - 1) > 0 ? (currentPage - 1) * limit : 0;
    let nextPage = (currentPage + 1) <= totalPages ? (currentPage + 1) * limit : 0;

    return {
        totalCount,
        nextPage,
        prevPage,
        currentPage: currentPage + 1
    }
}

export const dataWithPagination = (aggregateData: any, offset: number = 0, limit: number = 10, name: string = 'list') => {
    const totalCount = (aggregateData.length > 0 && aggregateData[0]?.totalCount[0]?.count) || 0

    let totalPages = Math.ceil(totalCount / limit);
    let currentPage = Math.floor(offset / limit);

    let prevPage = (currentPage - 1) > 0 ? (currentPage - 1) * limit : 0;
    let nextPage = (currentPage + 1) <= totalPages ? (currentPage + 1) * limit : 0;

    return {
        [name]: (aggregateData.length > 0 && aggregateData[0]?.data) || [],
        pagination: {
            totalCount,
            nextPage,
            prevPage,
            currentPage: currentPage + 1
        }
    }
}
