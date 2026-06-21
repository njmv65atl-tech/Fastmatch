export const Method = {
  GET(builder: any, url: string, header: any) {
    return builder.query({
      query: (body: any) => ({
        url: url,
        method: "GET",
        body: body,
        headers: header,
      }),
    });
  },
  POST(builder: any, url: string, header: any) {
    return builder.mutation({ 
      query: (body: any) => ({
        url: url,
        method: "POST",
        body: body,
        headers: header,
        formData: true,
      }),
    });
  },

  PUT(builder: any, url: string, header: any) {
    return builder.mutation({
      query: (body: any) => ({
        url: url,
        method: "PUT",
        body: body,
        headers: header,
      }),
    });
  },
  DELETE(builder: any, url: string, header: any) {
    return builder.mutation({
      query: (body: any) => ({
        url: url,
        method: "DELETE",
        body: body,
        headers: header,
      }),
    });
  },
};
