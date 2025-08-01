import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import { userSite } from './userSite.model';
import { IuserSite } from './userSite.interface';
import { UserSiteService } from './userSite.service';
import catchAsync from '../../../shared/catchAsync';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { User } from '../../user/user.model';
import { TRole } from '../../user/user.constant';
import ApiError from '../../../errors/ApiError';

export class userSiteController extends GenericController<
  typeof userSite,
  IuserSite
> {
  userSiteService = new UserSiteService();

  constructor() {
    super(new UserSiteService(), 'userSite');
  }

  /********
   * 
   * Customer : Home Page : get All site by personId and customer type 
   * 
   * ******* */
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    filters.isDeleted = false; // only get non-deleted users
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'siteId',
        select: 'name createdAt type attachments',
        populate: {
          path: 'attachments', // deep populate attachments
          select: 'attachment' // only pick attachmentName
        }
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';

    let userInfo;

    if(req.user.userId){
      userInfo = await User.findById(req.user.userId).select('name role profileImage');
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  getAllWithPaginationForAdmin = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    filters.isDeleted = false;
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'siteId',
        select: 'name createdAt type ', // attachments
        // populate: {
        //   path: 'attachments', // deep populate attachments
        //   select: 'attachment' // only pick attachmentName
        // }
      },
      {
        path: 'personId',
        select: 'name role user_custom_id email address' // only pick name, role and profileImage
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';

    let userInfo;

    if(req.user.userId){
      userInfo = await User.findById(req.user.userId).select('name role profileImage');
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  getAllWithPaginationWithManagerInfo = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    filters.isDeleted = false; // only get non-deleted users

    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'siteId',
        select: 'name createdAt type attachments',
        populate: {
          path: 'attachments', // deep populate attachments
          select: 'attachment' // only pick attachmentName
        }
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
  
    let userInfo;

    if(req.query.siteId){
      userInfo = await userSite.find({
        siteId : req.query.siteId,
        isDeleted: false,
        role: TRole.manager
      }).select('personId').populate(
        {
          path: 'personId',
          select: 'name role profileImage'
        }
      );
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

/***********
 * 
 * Dashboard (Admin) : Work Hours : get all site and work hour of employee ... 
 * 
 * *********** */ 
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForWorkHour = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    filters.isDeleted = false; // only get non-deleted users
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'personId',
        select: 'name' // name 
      },
      {
        path: 'siteId',
        select: 'name'
      }
    ];

    const dontWantToInclude = '-isDeleted -updatedAt -createdAt -__v';

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  getAllWithPaginationForManager = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    filters.isDeleted = false; // only get non-deleted users
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'personId',
        select: 'name role' // name 
      },
      {
        path: 'siteId',
        select: 'name createdAt type attachments',
        populate: {
          path: 'attachments',
          select: 'attachment'
        }
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
  
    let userInfo;

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);
   
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  
/***********
 * 
 * Web (Manager) : Dashboard : get all site by personId and customer type 
 * 
 * *********** */ 
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForManagerDashboard = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    filters.isDeleted = false; // only get non-deleted users

    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'siteId',
        select: 'name address status'
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
    
    let userInfo;

    if(req.user.userId){
      userInfo = await User.findById(req.user.userId).select('name role');
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  /**************
   * 
   *  (App) (Customer) : Show all Related User For Create Conversation
   *  
   *  /conversation/paginate
   * 
   * ************* */
  
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForUserConversation = catchAsync(async (req: Request, res: Response) => {
    
    // Step 1: Retrieve all siteIds related to the user
    const sitesRelatedToUser = await userSite.find(
      { personId: req.user.userId, isDeleted: false },
      'siteId' // Select only the 'siteId' field
    );

    // Extract siteIds from the result
    const siteIds = sitesRelatedToUser.map(site => site.siteId);

    // Step 2: Retrieve all personIds related to the retrieved siteIds
    const personIdsRelatedToSites = await userSite.find(
      {  personId: req.user.userId, siteId: { $in: siteIds }, isDeleted: false },//⚡⚡
      'personId siteId' // Select only the 'personId' field
    ).populate({
      path: 'personId',
      select: 'name role',
    });

    // Step 3: Aggregate unique personIds into a Set
    const uniquePersonIds = new Set(personIdsRelatedToSites.map(person => 
        // person.personId
        {
        console.log('person::', person)
          return {
            personId: person.personId,
            siteId: person.siteId
          }
      }  
    ).filter(personId => {

      return personId.personId.toString() !== req.user.userId.toString();

    } ) // Exclude logged-in user
    );

    // Convert the Set to an array if needed
    const uniquePersonIdsArray = Array.from(uniquePersonIds);

    console.log('Unique Person IDs:', uniquePersonIdsArray);

    console.log('req.user.userId', req.user.userId);


    sendResponse(res, {
      code: StatusCodes.OK,
      data: uniquePersonIdsArray,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  /**************
   * 
   *  (Dashboard) (Admin) : Show all Related User For Create Conversation
   * 
   * /conversation/admin/paginate
   * 
   * ************* */
  
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForAdminConversation = catchAsync(async (req: Request, res: Response) => {
    
    /*****************************

      sitesRelatedToUser.map((site) => {
      // now for every siteId.. we have to get related PersonId and set those id into a set .. 
      // so that we can get unique personId

    *****************************/

    
      const allowedTypes = [
        TRole.admin,
        TRole.manager,
        TRole.user,
        TRole.customer
      ];
    

      if(!allowedTypes.includes(req.query.role)){
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid type .. Allowed types are ${allowedTypes.join(', ')}`);
      }
    

    // Step 1: Retrieve all siteIds related to the user
    const sitesRelatedToUser = await userSite.find(
      { personId: req.user.userId, isDeleted: false },
      'siteId' // Select only the 'siteId' field
    );

    // Extract siteIds from the result
    const siteIds = sitesRelatedToUser.map(site => site.siteId);

    // Step 2: Retrieve all personIds related to the retrieved siteIds
    const personIdsRelatedToSites = await userSite.find(
      { siteId: { $in: siteIds }, isDeleted: false },
      'personId siteId isDeleted' // Select only the 'personId' field
    ).populate({
      path: 'personId',
      select: 'name role profileImage',
    });


     // Step 3: Use Map to ensure unique personIds
      const uniquePersonsMap = new Map();

      personIdsRelatedToSites.forEach(person => {
  
        const personIdStr = person.personId._id.toString();
        
        // Filter conditions
        if (personIdStr !== req.user.userId.toString() && 
            person.personId.role === req.query.role && person.isDeleted === false) {

              console.log('person🟡🟡:', person);
          
          // If person not already in map, add them
          if (!uniquePersonsMap.has(personIdStr)) {
            uniquePersonsMap.set(personIdStr, {
              personId: person.personId,
              siteId: person.siteId // This will be the first site they're associated with
            });
          }
        }
      });

      // console.log('uniquePersonsMap::', uniquePersonsMap);

    /*****************

    // Step 3: Aggregate unique personIds into a Set
    const uniquePersonIds = new Set(personIdsRelatedToSites.map(person => 
      {
        // console.log('person::', person)
          return {
            personId: person.personId,
            siteId: person.siteId
          }
      }  
    ).filter(personId => {

      // console.log('personId =====', personId);

      return personId.personId.toString() !== req.user.userId.toString()  && 
      personId.personId.role === req.query.role; // Exclude logged-in user and filter by role

    }) // Exclude logged-in user
    );

    **************** */

    // Convert the Set to an array if needed
    ////const uniquePersonIdsArray = Array.from(uniquePersonIds);
    const uniquePersonIdsArray = Array.from(uniquePersonsMap.values());

    sendResponse(res, {
      code: StatusCodes.OK,
      data: uniquePersonIdsArray,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  /**************
   * 
   *  (Dashboard) (Admin) : Show all Related User For Create Conversation
   * 
   * /conversation/person/paginate
   * 
   * ************* */
  
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForPersonConversation = catchAsync(async (req: Request, res: Response) => {
  
    // Step 1: Retrieve all siteIds related to the user
    const sitesRelatedToUser = await userSite.find(
      { personId: req.user.userId, isDeleted: false },
      'siteId' // Select only the 'siteId' field
    );

    // Extract siteIds from the result
    const siteIds = sitesRelatedToUser.map(site => site.siteId);

    // Step 2: Retrieve all personIds related to the retrieved siteIds
    const personIdsRelatedToSites = await userSite.find(
      { siteId: { $in: siteIds }, isDeleted: false },
      'personId siteId' // Select only the 'personId' field
    ).populate({
      path: 'personId',
      select: 'name role canMessage',
    });


     // Step 3: Use Map to ensure unique personIds
      const uniquePersonsMap = new Map();


      personIdsRelatedToSites.forEach(person => {
  
        const personIdStr = person.personId._id.toString();
        
        // Filter conditions
        if (personIdStr !== req.user.userId.toString()) {
          
          // If person not already in map, add them
          if (!uniquePersonsMap.has(personIdStr)) {
            uniquePersonsMap.set(personIdStr, {
              personId: person.personId,
              siteId: person.siteId // This will be the first site they're associated with
            });
          }
        }
      });

      console.log('uniquePersonsMap::', uniquePersonsMap);

    /*****************

    // Step 3: Aggregate unique personIds into a Set
    const uniquePersonIds = new Set(personIdsRelatedToSites.map(person => 
      {
        // console.log('person::', person)
          return {
            personId: person.personId,
            siteId: person.siteId
          }
      }  
    ).filter(personId => {

      // console.log('personId =====', personId);

      return personId.personId.toString() !== req.user.userId.toString()  && 
      personId.personId.role === req.query.role; // Exclude logged-in user and filter by role

    }) // Exclude logged-in user
    );

    **************** */

    // Convert the Set to an array if needed
    ////const uniquePersonIdsArray = Array.from(uniquePersonIds);
    const uniquePersonIdsArray = Array.from(uniquePersonsMap.values());

    sendResponse(res, {
      code: StatusCodes.OK,
      data: uniquePersonIdsArray,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  
/***********
 * 
 * (Dashboard) (Admin) : As per Sayed Vai suggestion,  when admin search for a person.. 
 * i should show that persons name , image, id, and siteId .. 
 * 
 * *********** */

  getAllWithPaginationForAdminConversationUpdated = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const query: Record<string, any> = {};
    options.limit = 20000;

    if (filters.name) {
      query['name'] = { $regex: filters.name, $options: 'i' };
    }
    
    const populateOptions = [ // : (string | {path: string, select: string}[])
    // {
    //   path: 'cameraId',
    //   select: ''
    // },
    ];

    const dontWantToInclude = 'name profileImage' ; // -role // name address phoneNumber status
  

    const users = await User.paginate(query, options, populateOptions, dontWantToInclude);


    if (!users) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No users found');
    }

    // console.log('users::', users);

    // if(users.results.length > 0){
      
    //   users.results.map(async (user) => {
    //     // console.log('hit 🟢', user);
    //     // for user._id .. we need to get siteId from userSite model
        
    //     const site  = await userSite.findOne({ personId: user._id }).select('siteId'); // Assuming userSite has siteId field
    //      console.log('site::', site);
    //      user?.siteId = site.siteId; // Convert ObjectId to string for consistency
      
    //   })
    // }


    if (users.results.length > 0) {
  await Promise.all(
    users.results.map(async (user) => {
      const site = await userSite.findOne({ personId: user._id }).select('siteId');
      if (site) {
        user.siteId = site.siteId;
      }
    })
  );
}

    console.log('users after adding siteId::', users);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: users,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  

  /*********
   * 
   * Dashboard (Admin) : Work Hours : add work hour for a user to a site 💡 
   * 
   * ******** */
  updateWorkHourByUserSiteId = catchAsync(async (req: Request, res: Response) => {
    const {
      workHours
    } = req.body;

    if(!req.params.userSiteId || !workHours){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'userSiteId and workHours are required');
    }

    const updatedUserSitesWorkHour = await userSite.findByIdAndUpdate(
      req.params.userSiteId,
      {$set: { workHours: workHours }},
      { new: true } // runValidators: true
    )

    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedUserSitesWorkHour,
      message: `work hours updated successfully`,
      success: true,
    });

  });

  // add more methods here if needed or override the existing ones 
}
