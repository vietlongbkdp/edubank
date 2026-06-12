export const ok = (res, data, message = 'OK') => res.status(200).json({ success: true, message, data });
export const err = (res, status, message) => res.status(status).json({ success: false, message });
