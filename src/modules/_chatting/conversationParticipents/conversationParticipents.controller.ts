import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";
import { GenericController } from "../../__Generic/generic.controller";
import { IConversation } from "../conversation/conversation.interface";
import { ConversationParticipents } from "./conversationParticipents.model";

import {  ConversationParticipentsService } from "./conversationParticipents.service";
import pick from "../../../shared/pick";
import omit from "../../../shared/omit";
import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import { Conversation } from "../conversation/conversation.model";
import mongoose from "mongoose";

const conversationParticipentsService = new ConversationParticipentsService();
export class ConversationParticipentsController extends GenericController<typeof ConversationParticipents, IConversation> {
  constructor(){
      super(new ConversationParticipentsService(), "Conversation Participents")
  }

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'userId',
        select: 'name profileImage' 
      },
      // 'personId'
      {
        path: 'conversationId',
        select: 'lastMessage updatedAt'
      }
    ];

    const select = '-__v -updatedAt -createdAt'; // -role

    const result = await this.service.getAllWithPagination(filters, options, populateOptions, select);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // Check if logged-in user has a conversation with another user
  hasConversationWithUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { otherUserId } = req.query; // userId,

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Both userId and otherUserId are required' });
    }

    
    // Find all conversations where the user is involved
    const userConversations = await ConversationParticipents.find({
      userId,
      isDeleted: false,
    }).select('conversationId');

    const conversationIds = userConversations.map((cp) => cp.conversationId);

    // Find a conversation among those where the otherUserId also participates
    const existingConversation = await ConversationParticipents.findOne({
      userId: otherUserId,
      conversationId: { $in: conversationIds },
      isDeleted: false,
    });

    if (existingConversation) {
      const fullConversation = await Conversation.findById(
        existingConversation.conversationId
      );
      // return res.json({
      //   exists: true,
      //   conversation: fullConversation,
      // });

      sendResponse(res, {
        code: StatusCodes.OK,
        data: fullConversation,
        message: `Conversation found`,
        success: true,
      });
    }

    sendResponse(res, {
        code: StatusCodes.NOT_FOUND,
        data: null,
        message: `Conversation not found`,
        success: true,
      });
  });

/************ This code is not working . Updated method : getRelatedUsers
 * 
 * we need logged in users conversationsParticipents where we want to show only another person not logged in user  
 * For App ... 
 * 
 * ************ */ 
  getRelatedUsers1 = catchAsync(async (req: Request, res: Response) => {
    let loggedInUserId = req.user.userId;
    
    const relatedUsers = await ConversationParticipents.aggregate([
      // Stage 1: Find all conversations where the logged-in user participates
      {
        $match: {
          userId: new mongoose.Types.ObjectId(loggedInUserId),
          isDeleted: false
        }
      },
      // Stage 2: Get all participants from those conversations
      {
        $lookup: {
          from: 'conversationparticipants', // collection name (usually lowercase + plural)
          localField: 'conversationId',
          foreignField: 'conversationId',
          as: 'allParticipants'
        }
      },
      // Stage 3: Unwind the participants array
      {
        $unwind: '$allParticipants'
      },
      // Stage 4: Filter out the logged-in user and deleted participants
      {
        $match: {
          'allParticipants.userId': { $ne: new mongoose.Types.ObjectId(loggedInUserId) },
          'allParticipants.isDeleted': false
        }
      },
      // Stage 5: Group by userId to avoid duplicates
      {
        $group: {
          _id: '$allParticipants.userId',
          participantData: { $first: '$allParticipants' },
          conversations: { $addToSet: '$conversationId' }
        }
      },
      // Stage 6: Populate user data
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      // Stage 7: Populate conversation data
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversations',
          foreignField: '_id',
          as: 'conversationData'
        }
      },
      // Stage 8: Format the output
      {
        $project: {
          _id: 0,
          userId: {
            _userId: '$_id',
            name: { $arrayElemAt: ['$userData.name', 0] },
            profileImage: { $arrayElemAt: ['$userData.profileImage', 0] }
          },
          conversations: '$conversationData',
          participantInfo: {
            joinedAt: '$participantData.joinedAt',
            isDeleted: '$participantData.isDeleted',
            _conversationParticipentsId: '$participantData._id'
          }
        }
      }
    ]);

     //;

    sendResponse(res, {
      code: StatusCodes.OK,
      data: relatedUsers,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

/************ Updated Method .. Working as expected ... 
 * 
 * we need logged in users conversationsParticipents where we want to show only another person not logged in user  
 * For App ... 
 * 
 * ************ */ 
  getRelatedUsers = catchAsync(async (req: Request, res: Response) => {
    let loggedInUserId = req.user.userId;
    // Step 1: Find all conversations the logged-in user participates in
    const userConversations = await ConversationParticipents.find({
      userId: loggedInUserId,
      isDeleted: false
    }).select('conversationId');

    const conversationIds = userConversations.map(conv => conv.conversationId);

    // Step 2: Find all participants in those conversations (excluding the logged-in user)
    const relatedParticipants = await ConversationParticipents.find({
      conversationId: { $in: conversationIds },
      userId: { $ne: loggedInUserId },
      isDeleted: false
    })
    .populate({
      path: 'userId',
      select: 'name profileImage role'
    })
    .populate({
      path: 'conversationId',
      select: 'lastMessage updatedAt'
    });

    // Step 3: Remove duplicates and format data
    const uniqueUsers = {};
    
    relatedParticipants.forEach(participant => {
      const userId = participant.userId._id.toString();
      
      if (!uniqueUsers[userId]) {
        uniqueUsers[userId] = {
          userId: {
            _userId: participant.userId._id,
            name: participant.userId.name,
            profileImage: participant.userId.profileImage,
            role: participant.userId.role
          },
          conversations: [],
          isOnline: global.socketUtils.isUserOnline(userId),
          // participantInfo: {
          //   joinedAt: participant.joinedAt,
          //   isDeleted: participant.isDeleted,
          //   _conversationParticipentsId: participant._id
          // }
        };
      }
      
      // Add conversation if not already added
      const conversationExists = uniqueUsers[userId].conversations.some(
        conv => conv._conversationId.toString() === participant.conversationId._id.toString()
      );
      
      if (!conversationExists) {
        uniqueUsers[userId].conversations.push({
          _conversationId: participant.conversationId._id,
          lastMessage: participant.conversationId.lastMessage,
          updatedAt: participant.conversationId.updatedAt
        });
      }
    });



    // let ress = await conversationParticipentsService.getAllConversationsOnlyPersonInformationByUserId(loggedInUserId);

    //return Object.values(uniqueUsers);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: Object.values(uniqueUsers),// ress, //Object.values(uniqueUsers),
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  /*********
   * 
   * 
   * 
   * ******* */
  getAllConversationByUserIdWithPagination = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;

    

  })


    // add more methods here if needed or override the existing ones
}