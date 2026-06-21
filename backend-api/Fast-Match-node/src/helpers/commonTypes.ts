import mongoose from "mongoose"

export const stringType = (required: boolean) => {
    return {
        type: String,
        default: null,
        required
    }
}

export const dateType = (required: boolean) => {
    return {
        type: Date,
        default: null,
        required
    }
}

export const numberType = (required: boolean) => {
    return {
        type: Number,
        default: 0,
        required
    }
}

export const booleanType = (required: boolean) => {
    return {
        type: Boolean,
        default: false,
        required
    }
}


export const booleanTypeWithTrue = (required: boolean) => {
    return {
        type: Boolean,
        default: true,
        required
    }
}

export const refType = (ref: string) => {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref,
        default: null
    }
}

export const objectIdType = () => {
    return {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}

export const enumType = (obj: object) => {
    return {
        type: String,
        enum: Object.keys(obj)
    }
}