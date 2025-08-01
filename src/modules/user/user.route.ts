import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { UserValidation } from './user.validation';
import { IUser } from './user.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IUser>(
  filters: T[]
) => {
  return filters;
};


//info : pagination route must be before the route with params
//[🚧][🧑‍💻][🧪] // ✅ 🆗
//💹📈 need scalability .. like mongo db indexing .. 
/*
 🚧 // TODO: name and email er jonno regex add korte hobe ..  
*/
// get all users where role is customer [pagination ]  sure na .. eta user site relation e hoite pare .. 
// Admin:  get all user where role is user [pagination ] 
// Admin: get all user where role is manager [pagination ] 

router.route('/paginate').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'role', 'isDeleted'])),
  UserController.getAllUserForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.route('/paginate/admin').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'role', 'status', 'createdAt'])),
  UserController.getAllAdminForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.post(
  "/create-customer-and-send-mail",
  [
    upload.fields([
      { name: 'companyLogo', maxCount: 1 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  validateRequest(UserValidation.sendInvitationToBeCustomerValidationSchema),
  UserController.sendInvitationLinkToAdminEmail
);

router.post(
  "/create-userOrManager-and-send-mail",
  [
    upload.fields([
      { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  validateRequest(UserValidation.sendInvitationToBeUserAndManagerValidationSchema),
  UserController.sendInvitationLinkToAdminEmail
);

/*************************
 * 
 * // Risky .. If you pass collectionName as a parameter, it will delete all data from that collection.
 * 
 * ********************* */
router.post('/delete/:collectionName',
  auth('admin'),
  UserController.deleteAllDataFromCollection
)



/**
 * App: Under Profile Section User Module Related End Points 
 *
 */

router
.route('/profile')
.put(
  auth('common'),
  UserController.updateProfile
);

/***********
 * 
 * Admin : edit customer by id 
 * 
 * ********* */
//[🚧][🧑‍💻✅][🧪🆗] // query :: userId  SC
router.route('/edit-user/:userId')
  .put(
    auth('admin'),
    [
    upload.fields([
      { name: 'attachments', maxCount: 1 }, // Allow up to 1 cover photos
    ]),
  ],
    // validateRequest(UserValidation.editUserValidationSchema), // TODO : Must Valisation add kora lagbe .. 
    UserController.updateUserProfile
  );

/*************************
 * // Working Perfectly .. 
 * // (App) | Customer , User | Upload profile image ... 
 * 
 * ********************* */
router
.route('/profile-image')
.put(
  auth('common'),
  [upload.single('profileImage')],
  UserController.updateProfileImage
);

/*************************
 *  
 * (App) | Customer , User | get profile Details... 
 * 
 * ********************* */
router.route('/get-profile-info').get(
  auth('common'),
  UserController.getMyProfile
);

/*************************
 *  
 * (Dashboard) | Admin , SuperAdmin | get profile Details... 
 * 
 * ********************* */
router.route('/get-profile-info/admin').get(
  auth('common'),
  UserController.getMyProfileForAdmin
);


router.get('/get-user-info/:userId', 
  auth('common'), 
  UserController.getSingleUser);

/****
 * 
 * params e userId pass korte hobe .. 
 * 
 * ******* */
router.route('/softDelete/:id').delete(
  auth('common'),
  UserController.deleteMyProfile
);


/************
 * 
 * get all manager and user for admin dashboard .. create site 
 * 
 * ********** */

router.route('/get-all-manager-and-user-for-admin-dashboard').get(
  auth('admin'),
  UserController.getAllManagerAndUserForAdminDashboard
);

export const UserRoutes = router;
