import axios from '../axios';

export type MyProfile = {
  _id: string;
  username: string;
  role: string;
  status: string;
  fullName?: string;
  address?: string;
  phoneNumber?: string;
};

export async function getMyProfileApi() {
  const { data } = await axios.get('/api/me/profile');
  return data as { ok: true; profile: MyProfile };
}

export async function updateMyProfileApi(payload: {
  fullName?: string;
  address?: string;
  phoneNumber?: string;
}) {
  const { data } = await axios.patch('/api/me/profile', payload);
  return data as { ok: true; profile: MyProfile };
}
