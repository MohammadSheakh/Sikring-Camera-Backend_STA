import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import { UserCustomService, UserService } from './user.service';
import { User } from './user.model';
import mongoose, { Types } from 'mongoose';
import { TokenService } from '../token/token.service';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';
import { AuthService } from '../auth/auth.service';
import { Request, Response } from 'express';
import { TStatusType, TSubscriptionType } from './user.constant';
import omit from '../../shared/omit';
import { UserSiteService } from '../_site/userSite/userSite.service';
import { IauditLog } from '../auditLog/auditLog.interface';
import { TStatus } from '../auditLog/auditLog.constant';
import eventEmitterForAuditLog from '../auditLog/auditLog.service';

const userCustomService = new UserCustomService();

const createAdminOrSuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await UserService.createAdminOrSuperAdmin(payload);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: result,
    message: `${
      payload.role === 'admin' ? 'Admin' : 'Super Admin'
    } created successfully`,
  });
});

//get single user from database
const getSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserService.getSingleUser(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//update profile image
const updateProfileImage = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  if (req.file) {
    req.body.profile_image = {
      imageUrl: '/uploads/users/' + req.file.filename,
      file: req.file,
    };
  }
  const result = await UserService.updateMyProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Profile image updated successfully',
  });
});

//update user from database
const updateMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  if (req.file) {
    req.body.profile_image = {
      imageUrl: '/uploads/users/' + req.file.filename,
      file: req.file,
    };
  }
  const result = await UserService.updateMyProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//update user status from database
const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  const result = await UserService.updateUserStatus(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User status updated successfully',
  });
});

//update user
const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  const result = await UserService.updateUserProfile(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//get my profile //[🚧][🧑‍💻✅][🧪🆗]
const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//get my profile //[🚧][🧑‍💻✅][🧪🆗]
const getMyProfileOnlyRequiredField = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getMyProfileOnlyRequiredField(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//delete user from database
const deleteMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.deleteMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User deleted successfully',
  });
});

//////////////////////////////////////////////////////////

/*********
 * 
 *  Admin:  Register Customer
 *   
 *  But we dont need to register customer .. since we have send
 *  invitation line functionality .. lets use that function  
 * ********* */

//[🚧][🧑‍💻][🧪] // ✅ 🆗  
// const createCustomer = catchAsync(async (req, res) => {

// }
  

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllUserForAdminDashboard = catchAsync(async (req, res) => {
  const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  
  const populateOptions: (string | {path: string, select: string}[]) = [
    // {
    //   path: 'cameraId',
    //   select: ''
    // },
    // // 'personId'
    // {
    //   path: 'siteId',
    //   select: ''
    // }
  ];

  // const dontWantToInclude = ['-localLocation -attachments']; // -role

  const dontWantToInclude = ''; // -role
  
  const result = await userCustomService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: `All data with pagination`,
    success: true,
  });
  
  /*********************
  
  const filters = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const query = {};

  // Create a copy of filter without isPreview to handle separately
  const mainFilter = { ...filters };

  // Loop through each filter field and add conditions if they exist
  for (const key of Object.keys(mainFilter)) {
    if (key === 'name' && mainFilter[key] !== '') {
      query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
    } else {
      query[key] = mainFilter[key];
    }
  }

  const result = await userCustomService.getAllWithPagination(query, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,

    message: 'All users fetched successfully',
  });

  ***************** */
});

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllAdminForAdminDashboard = catchAsync(async (req, res) => {
  // const filters = req.query;

  const filters = { ...req.query };

  // If role is not specified in query, set default to show both admin and superAdmin
  if (!filters.role) {
    filters.role = { $in: ['admin', 'superAdmin'] };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const result = await userCustomService.getAllWithPagination(filters, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'All admin fetched successfully',
  });
});

//[🚧][🧑‍💻][🧪] // ✅ 🆗 // 🧪🧪🧪🧪🧪🧪🧪🧪🧪 need test
// send Invitation Link for a admin
const sendInvitationLinkToAdminEmail = catchAsync(async (req, res) => {
  const user = await UserService.getUserByEmail(req.body.email);

  /**
   *
   * req.body.email er email jodi already taken
   * if ----
   * then we check isEmailVerified .. if false .. we make that true
   *
   * if isDeleted true then we make it false
   *
   * else ---
   *  we create new admin and send email
   *
   */

  if (user && user.isEmailVerified === true) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  } else if (user && user.isDeleted === true) {
    user.isDeleted = false;
    await user.save();
  } else if (user && user.isEmailVerified === false) {
    user.isEmailVerified = true;
    await user.save();
    const token = await TokenService.createVerifyEmailToken(user);
    await sendAdminOrSuperAdminCreationEmail(
      req?.body?.email,
      req.body.role,
      req?.body?.password,
      req.body.message ?? 'welcome to the team'
    );

    return sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message:
        'User already found and Invitation link sent successfully for admin',
    });
  } else {

    let actionPerformed = '';

    // create new user
    if (req.body.role == 'customer') {
      const newUser = await AuthService.createUser({
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        isEmailVerified: true, // INFO: Customer dont need to verify Email
        name : req.body.name,
        user_custom_id : req.body.customId, 
        address : req.body.address,
        // TODO : Company Logo upload korte hobe 
      });

      /***********
       * 
       * jei userId create hobe .. sheta ar req.body.siteId niye
       * userSite create korte hobe  
       * 
       * ********** */

      if(newUser?.user?._id && req.body.siteId){
        /**********
         * 
         * // TODO : we need to check if the siteId is valid or not
         * 
         * ******** */

        // TODO : create userSite here
        let userSiteRes = await new UserSiteService().create(
          {
            personId: newUser?.user._id,
            siteId: req.body.siteId,
            role: 'customer',
          }  
        );

        console.log('userSiteRes ', userSiteRes);
      }

      let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${req.body.role} named ${req.body.name} for site ${req.body.siteId}`,
          status: TStatus.success,
        }

        eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);
        




      return sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: 'New user created and email sent successfully',
      });
    }
  }
});


/*************************
 *
 * // Risky .. If you pass collectionName as a parameter, it will delete all data from that collection.
 *
 * ********************* */

const deleteAllDataFromCollection = async (req: Request, res: Response) => {
  try {
    const { collectionName } = req.params; // or req.query

    if (!collectionName) {
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: `collectionName parameter is required`,
      });
    }

    // Validate collectionName - only allow known collections for safety
    const allowedCollections = [
      'DailyCycleInsights',
      'Users',
      'Message',
      'Notification',
      'LabTestLog',
    ]; // example allowed list
    if (!allowedCollections.includes(collectionName)) {
      sendResponse(res, {
        code: StatusCodes.FORBIDDEN,
        message: `Operation not allowed on this collection`,
      });
    }

    // Get Mongoose model dynamically by collectionName
    // WARNING: Mongoose model names are case-sensitive and usually singular
    const Model = mongoose.models[collectionName];
    console.log('Model 🌋🌋', Model);
    if (!Model) {
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        success: false,
        message: `Model for collection '${collectionName}' not found`,
      });
    }

    // Delete all documents
    const result = await Model.deleteMany({});
    if(!result){
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        success: false,
        message: `Failed to delete documents from ${collectionName}`,
      });
    }

    sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      success: true,
      message: `All documents deleted from ${collectionName}`,
      data: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all data:', error);

    sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      success: false,
      message: `Internal server error`,
    });
  }
};




export const UserController = {
  createAdminOrSuperAdmin,
  getSingleUser,
  updateMyProfile,
  updateProfileImage,
  updateUserStatus,
  getMyProfile,
  updateUserProfile,
  deleteMyProfile,
  //////////////////////////
  getAllUserForAdminDashboard,
  getAllAdminForAdminDashboard,
  sendInvitationLinkToAdminEmail,

  
  ///////////////////////////////////////////////////
  deleteAllDataFromCollection,

  ///////////////////////////////////////////

  getMyProfileOnlyRequiredField,
};
