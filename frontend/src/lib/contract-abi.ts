/**
 * NOTE: This file is DEPRECATED - Not used for regular payment flow
 * 
 * This file contains the smart contract ABI for MayhouseExperience contract.
 * Currently still used by some components (HostDashboard, UserBookings, etc.)
 * but not used for the main booking flow.
 * 
 * Can be removed or kept for future Web3 integration.
 * 
 * Last used in booking flow: Before migration to API-based booking system
 */

// MayhouseExperience Contract ABI
// This is the interface to interact with your deployed smart contract

export const MAYHOUSE_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bookingId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "eventRunId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "seatCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPayment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "userStake",
        "type": "uint256"
      }
    ],
    "name": "BookingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bookingId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeReturned",
        "type": "uint256"
      }
    ],
    "name": "BookingCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bookingId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeForfeit",
        "type": "uint256"
      }
    ],
    "name": "BookingNoShow",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "eventRunId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundsIssued",
        "type": "uint256"
      }
    ],
    "name": "EventCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "eventRunId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "hostPayout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "hostStakeReturned",
        "type": "uint256"
      }
    ],
    "name": "EventCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "eventRunId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "host",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "experienceId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pricePerSeat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxSeats",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "hostStake",
        "type": "uint256"
      }
    ],
    "name": "EventRunCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_seatCount",
        "type": "uint256"
      }
    ],
    "name": "bookEvent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_pricePerSeat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_seats",
        "type": "uint256"
      }
    ],
    "name": "calculateRequiredStake",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_seatCount",
        "type": "uint256"
      }
    ],
    "name": "calculateBookingCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "payment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      }
    ],
    "name": "cancelEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_attendedBookingIds",
        "type": "uint256[]"
      }
    ],
    "name": "completeEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_experienceId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_pricePerSeat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxSeats",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_eventTimestamp",
        "type": "uint256"
      }
    ],
    "name": "createEventRun",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_bookingId",
        "type": "uint256"
      }
    ],
    "name": "getBooking",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "bookingId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "eventRunId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "seatCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPayment",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userStake",
            "type": "uint256"
          },
          {
            "internalType": "enum MayhouseExperience.BookingStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "bookedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct MayhouseExperience.Booking",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      }
    ],
    "name": "getEventBookings",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventRunId",
        "type": "uint256"
      }
    ],
    "name": "getEventRun",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "eventRunId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "host",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "experienceId",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "pricePerSeat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxSeats",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "seatsBooked",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "hostStake",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "eventTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "enum MayhouseExperience.EventStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "hostStakeWithdrawn",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct MayhouseExperience.EventRun",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_host",
        "type": "address"
      }
    ],
    "name": "getHostEvents",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserBookings",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111; // Sepolia

