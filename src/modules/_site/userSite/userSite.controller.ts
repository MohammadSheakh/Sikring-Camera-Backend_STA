import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { userSite } from './userSite.model';
import { IuserSite } from './userSite.interface';
import { userSiteService } from './userSite.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class userSiteController extends GenericController<
  typeof userSite,
  IuserSite
> {
  userSiteService = new userSiteService();

  constructor() {
    super(new userSiteService(), 'userSite');
  }

  // add more methods here if needed or override the existing ones 
  
}
