import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { IUser, TUser } from './user.interface';
import { User } from './user.model';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';

import { GenericService } from '../__Generic/generic.services';
import { userSite } from '../_site/userSite/userSite.model';
import { CameraPerson } from '../_camera/cameraPerson/cameraPerson.model';

interface IAdminOrSuperAdminPayload {
  email: string;
  password: string;
  role: string;
  message?: string;
}

export class UserCustomService extends GenericService<typeof User, IUser> {
  constructor() {
    super(User);
  }


}

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getUserByEmail = async (email: string) : Promise<TUser | null>  => {
  return User.findOne({ email });
};

const createAdminOrSuperAdmin = async (
  payload: IAdminOrSuperAdminPayload
): Promise<TUser> => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This email already exists');
  }
  const result = new User({
    first_name: 'New',
    last_name: ` ${payload.role === 'admin' ? 'Admin' : 'Super Admin'}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  });

  await result.save();
  //send email for the new admin or super admin via email service
  
  sendAdminOrSuperAdminCreationEmail(
    payload.email,
    payload.role,
    payload.password,
    payload.message
  );

  return result;
};

const getAllUsers = async (
  filters: Record<string, any>,
  options: PaginateOptions
): Promise<PaginateResult<TUser>> => {
  const query: Record<string, any> = {};
  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }
  return await User.paginate(query, options);
};



const getSingleUser = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

/********
 * 
 * Sikring Camera 
 * this is for update my profile ..
 * 
 * ********* */
const updateUserProfile = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};


//[🚧][🧑‍💻✅][🧪🆗]
const getMyProfile = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId).select('id name profileImage');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

//[🚧][🧑‍💻✅][🧪🆗]
const getMyProfileOnlyRequiredField = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId).select('name subscriptionType profileImage userId');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

const deleteMyProfile = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId);


  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if(result.isDeleted == true) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User already deleted');
  } 


  // soft delete userSite relation .. and personCamera Relation .. 
  await userSite.updateMany({ personId: userId }, { isDeleted: true });
  await CameraPerson.updateMany({ userId }, { isDeleted: true });

  result.isDeleted = true;
  
  await result.save();
  return result;
};


///////////////////////////////////////////////////////

export const UserService = {
  ///////////// Admin Related Service ///////////
  createAdminOrSuperAdmin,
  getAllUsers,

  /////////////////////////////////////////////////
  getSingleUser,
  
  updateUserProfile,
  getMyProfile,
  //updateProfileImage,
  deleteMyProfile,
  getUserByEmail,
  ///////////////  ...  Related Service ///////////
  

  //////////////////////////////////////
  getMyProfileOnlyRequiredField
};
