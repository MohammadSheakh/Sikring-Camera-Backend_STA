import { Request, Response } from 'express';
import catchAsync from '../src/shared/catchAsync';
import sendResponse from '../src/shared/sendResponse';
import { GenericController } from '../src/modules/__Generic/generic.controller';
import { Conversation } from '../src/modules/_chatting/conversation/conversation.model';
import { ConversationService } from '../src/modules/_chatting/conversation/conversation.service';
import { StatusCodes } from 'http-status-codes';
import { ConversationParticipentsService } from '../src/modules/_chatting/conversationParticipents/conversationParticipents.service';
import ApiError from '../src/errors/ApiError';
import { IConversation } from '../src/modules/_chatting/conversation/conversation.interface';
import { ConversationType } from '../src/modules/_chatting/conversation/conversation.constant';
import { MessagerService } from '../src/modules/_chatting/message/message.service';
import { IMessage } from '../src/modules/_chatting/message/message.interface';
import { RoleType } from '../src/modules/_chatting/conversationParticipents/conversationParticipents.constant';
import { User } from '../src/modules/user/user.model';
import { format } from 'date-fns';
import mongoose from 'mongoose';
import { sendDailyMessageToAllConversations } from '../src/modules/_chatting/conversation/conversation.cron';
import { Message } from '../src/modules/_chatting/message/message.model';

let conversationParticipantsService = new ConversationParticipentsService();
let messageService = new MessagerService();

export class ConversationV2Controller extends GenericController<typeof Conversation, IConversation> {
  conversationService = new ConversationService();

  constructor() {
    super(new ConversationService(), 'Conversation');
  }


  //  FIX : lastMessageSenderRole fix korte hobe .. 
  // override  // 2️⃣
  create = catchAsync(async (req: Request, res: Response) => {
    let type;
    let result: IConversation;
    // creatorId ta req.user theke ashbe
    //req.body.creatorId = req.user.userId;
    let { participants, message } = req.body; // type, attachedToId, attachedToCategory

    // type is based on participants count .. if count is greater than 2 then group else direct

    if (!participants) {
      // 🔥 test korte hobe logic ..
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Without participants you can not create a conversation'
      );
    }

    participants = [...participants, req.user.userId]; // add yourself to the participants list

    
    if (participants.length > 0) {
      type =
        participants.length > 2
          ? ConversationType.group
          : ConversationType.direct;

      const conversationData: IConversation = {
        creatorId: req.user.userId,
        type,
        month: format(new Date(), 'LLLL'), // format(new Date(), 'LLLL')
        year: new Date().getFullYear() //2026 , // new Date().getFullYear()
        // attachedToId,
        // attachedToCategory,
      };

      // check if the conversation already exists
      const existingConversation = await Conversation.findOne({
        creatorId: conversationData.creatorId,
        month: conversationData.month,
        year: conversationData.year,
      }).select('-isDeleted -updatedAt -createdAt -__v');

      if (!existingConversation){
        ////////// Create a new conversation

        result = await this.service.create(conversationData); // 🎯🎯🎯🎯

        if (!result) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Unable to create conversation'
          );
        }

        for (const participant of participants) {
          // try {
          // console.log('🔥🔥participants🔥', participants);

          // as participants is just an id .. 

          let user = await User.findById(participant).select('role');

          // console.log(
          //   '🔥🔥user role  🔥',
          //   user,
          //   user?.role,)

          const res1 = await conversationParticipantsService.create({
            userId: participant,
            conversationId: result?._id,
            role: user?.role === RoleType.user ? RoleType.user : RoleType.bot, // 🔴 ekhane jhamela ase .. 
          });

          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }

          // console.log('🔥🔥res1🔥', res1);
          // } catch (error) {
          // console.error("Error creating conversation participant:", error);
          // }
        }

        if (message && result?._id) {
          const res1: IMessage | null = await messageService.create({
            text: message,
            senderId: req.user.userId,
            conversationId: result?._id,
            senderRole: req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
          });
          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }
        }

        if(!message){
          const res1: IMessage | null = await messageService.create({
            text: "How are you feeling today ?",
            senderId: new mongoose.Types.ObjectId('68206aa9e791351fc9fdbcde'),  // this is bot id .. eta process.env file theke ashbe .. 
            conversationId: result?._id,
            senderRole: RoleType.bot,
          });

          // TODO :  there is nothing called lastMessageSenderRole in conversation model ..
          
          // also update the last message of the conversation 
          await Conversation.findByIdAndUpdate(
            result?._id,
            { lastMessageSenderRole: RoleType.bot}, // FIX ME : last message sender role bolte kichui nai .. 
            { new: true }
          ).select('-isDeleted -updatedAt -createdAt -__v');
        }
      }

      // dont need to create conversation .. 
      // just send message to the existing conversation

      let res1 ;
      if (message && existingConversation?._id) {
          let res1 : IMessage | null = await messageService.create({
            text: message,
            senderId: req.user.userId,
            conversationId: existingConversation?._id,
            senderRole: req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
          });
          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }
        }

      sendResponse(res, {
        code: StatusCodes.OK,
        data: existingConversation ? existingConversation : result,
        message: existingConversation ?  `${this.modelName} already exist` : `${this.modelName} created successfully`,
        success: true,
      });
    }
  });

  // this trigger Cron Job is For Manual Testing:
  triggerCronJob = catchAsync(async (req: Request, res: Response) => {
  try {
    await sendDailyMessageToAllConversations();
    
    sendResponse(res, {
      code: StatusCodes.OK,
      message: 'Cron job triggered successfully',
      success: true,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to trigger cron job'
    );
  }
  });


  
  // add more methods here if needed or override the existing ones
}
