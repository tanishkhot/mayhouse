"""
Blockchain Service Layer

Handles all interactions with the MayhouseExperience smart contract including:
- Creating event runs on-chain
- Booking events with stake
- Completing events and distributing funds
- Cancelling events and issuing refunds
- Reading blockchain state
"""

from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime

from web3 import Web3
from web3.contract import Contract
from eth_account import Account
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()


class BlockchainService:
    """Service for interacting with the MayhouseExperience smart contract."""

    # Smart contract ABI (you'll need to add the full ABI)
    CONTRACT_ABI = [
        # Add the full contract ABI here
        # For now, I'll add the essential functions
        {
            "inputs": [
                {"internalType": "string", "name": "_experienceId", "type": "string"},
                {"internalType": "uint256", "name": "_pricePerSeat", "type": "uint256"},
                {"internalType": "uint256", "name": "_maxSeats", "type": "uint256"},
                {"internalType": "uint256", "name": "_eventTimestamp", "type": "uint256"}
            ],
            "name": "createEventRun",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_eventRunId", "type": "uint256"},
                {"internalType": "uint256", "name": "_seatCount", "type": "uint256"}
            ],
            "name": "bookEvent",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_eventRunId", "type": "uint256"},
                {"internalType": "uint256[]", "name": "_attendedBookingIds", "type": "array"}
            ],
            "name": "completeEvent",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_eventRunId", "type": "uint256"}
            ],
            "name": "cancelEvent",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_eventRunId", "type": "uint256"}
            ],
            "name": "getEventRun",
            "outputs": [
                {
                    "components": [
                        {"internalType": "uint256", "name": "eventRunId", "type": "uint256"},
                        {"internalType": "address", "name": "host", "type": "address"},
                        {"internalType": "string", "name": "experienceId", "type": "string"},
                        {"internalType": "uint256", "name": "pricePerSeat", "type": "uint256"},
                        {"internalType": "uint256", "name": "maxSeats", "type": "uint256"},
                        {"internalType": "uint256", "name": "seatsBooked", "type": "uint256"},
                        {"internalType": "uint256", "name": "hostStake", "type": "uint256"},
                        {"internalType": "uint256", "name": "eventTimestamp", "type": "uint256"},
                        {"internalType": "uint8", "name": "status", "type": "uint8"},
                        {"internalType": "bool", "name": "hostStakeWithdrawn", "type": "bool"},
                        {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
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
                {"internalType": "uint256", "name": "_eventRunId", "type": "uint256"},
                {"internalType": "uint256", "name": "_seatCount", "type": "uint256"}
            ],
            "name": "calculateBookingCost",
            "outputs": [
                {"internalType": "uint256", "name": "payment", "type": "uint256"},
                {"internalType": "uint256", "name": "stake", "type": "uint256"},
                {"internalType": "uint256", "name": "total", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "_host", "type": "address"}
            ],
            "name": "getHostEvents",
            "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "getUserBookings",
            "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
            "stateMutability": "view",
            "type": "function"
        }
    ]

    def __init__(self):
        """Initialize Web3 connection and contract."""
        # Get blockchain settings from env
        self.rpc_url = settings.blockchain_rpc_url
        self.contract_address = settings.contract_address
        self.platform_private_key = settings.platform_private_key
        
        # Initialize Web3 connection lazily - don't fail on startup
        self.w3 = None
        self.contract = None
        self.platform_account = None
        self._is_connected = False
        
        # Try to connect, but don't fail if it doesn't work
        try:
            self._connect()
        except Exception as e:
            print(f"⚠️  Warning: Could not connect to blockchain on startup: {e}")
            print("⚠️  Blockchain features will be unavailable until connection is established.")
    
    def _connect(self):
        """Establish blockchain connection."""
        if self._is_connected and self.w3 and self.w3.is_connected():
            return
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Check connection
        if not self.w3.is_connected():
            raise Exception("Failed to connect to blockchain")
        
        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contract_address),
            abi=self.CONTRACT_ABI
        )
        
        # Platform account (for gas and contract calls)
        if self.platform_private_key:
            self.platform_account = Account.from_key(self.platform_private_key)
        else:
            self.platform_account = None
        
        self._is_connected = True
    
    def _ensure_connected(self):
        """Ensure blockchain connection is established, raise error if not."""
        if not self._is_connected or not self.w3 or not self.w3.is_connected():
            try:
                self._connect()
            except Exception as e:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=503,
                    detail="Blockchain service is unavailable. Please check RPC connection."
                )

    def convert_inr_to_wei(self, price_inr: Decimal, eth_price_inr: Decimal = Decimal("200000")) -> int:
        """
        Convert INR price to Wei (smallest ETH unit).
        
        Args:
            price_inr: Price in Indian Rupees
            eth_price_inr: Current ETH price in INR (default: 200,000 INR)
        
        Returns:
            Price in Wei
        """
        self._ensure_connected()
        # Convert INR to ETH
        eth_amount = price_inr / eth_price_inr
        # Convert ETH to Wei (1 ETH = 10^18 Wei)
        wei_amount = self.w3.to_wei(float(eth_amount), 'ether')
        return int(wei_amount)

    def convert_wei_to_inr(self, wei_amount: int, eth_price_inr: Decimal = Decimal("200000")) -> Decimal:
        """Convert Wei to INR."""
        self._ensure_connected()
        eth_amount = self.w3.from_wei(wei_amount, 'ether')
        inr_amount = Decimal(str(eth_amount)) * eth_price_inr
        return inr_amount

    async def create_event_run_onchain(
        self,
        experience_id: str,
        price_inr: Decimal,
        max_seats: int,
        event_timestamp: datetime,
        host_wallet_address: str
    ) -> Tuple[int, str]:
        """
        Create an event run on the blockchain.
        
        Args:
            experience_id: Database experience ID
            price_inr: Price per seat in INR
            max_seats: Maximum number of seats
            event_timestamp: When the event occurs
            host_wallet_address: Host's Ethereum wallet address
        
        Returns:
            Tuple of (blockchain_event_run_id, transaction_hash)
        """
        self._ensure_connected()
        try:
            # Convert price to Wei
            price_per_seat_wei = self.convert_inr_to_wei(price_inr)
            
            # Convert datetime to Unix timestamp
            event_unix_timestamp = int(event_timestamp.timestamp())
            
            # Calculate required host stake (20% of total event value)
            total_value_wei = price_per_seat_wei * max_seats
            required_stake_wei = (total_value_wei * 20) // 100
            
            # Build transaction
            # Note: In production, this should be signed by the HOST, not platform
            # For now, we'll use platform account and later refund/adjust
            tx = self.contract.functions.createEventRun(
                experience_id,
                price_per_seat_wei,
                max_seats,
                event_unix_timestamp
            ).build_transaction({
                'from': self.platform_account.address,
                'value': required_stake_wei,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.platform_account.address),
                'chainId': self.w3.eth.chain_id
            })
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.platform_private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt['status'] != 1:
                raise Exception("Transaction failed")
            
            # Get the event run ID from transaction logs
            # The createEventRun function returns the event run ID
            blockchain_event_run_id = self._parse_event_run_id_from_receipt(tx_receipt)
            
            return blockchain_event_run_id, tx_hash.hex()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create event run on blockchain: {str(e)}"
            )

    async def get_event_run_from_chain(self, blockchain_event_run_id: int) -> dict:
        """Get event run details from blockchain."""
        self._ensure_connected()
        try:
            event_run = self.contract.functions.getEventRun(blockchain_event_run_id).call()
            
            # Parse the tuple response
            return {
                'eventRunId': event_run[0],
                'host': event_run[1],
                'experienceId': event_run[2],
                'pricePerSeat': event_run[3],
                'maxSeats': event_run[4],
                'seatsBooked': event_run[5],
                'hostStake': event_run[6],
                'eventTimestamp': event_run[7],
                'status': event_run[8],
                'hostStakeWithdrawn': event_run[9],
                'createdAt': event_run[10]
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event run not found on blockchain: {str(e)}"
            )

    async def calculate_booking_cost(
        self,
        blockchain_event_run_id: int,
        seat_count: int
    ) -> Tuple[int, int, int]:
        """
        Calculate booking cost including stake.
        
        Returns:
            Tuple of (payment_wei, stake_wei, total_wei)
        """
        self._ensure_connected()
        try:
            result = self.contract.functions.calculateBookingCost(
                blockchain_event_run_id,
                seat_count
            ).call()
            
            return result[0], result[1], result[2]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to calculate booking cost: {str(e)}"
            )

    async def complete_event_onchain(
        self,
        blockchain_event_run_id: int,
        attended_blockchain_booking_ids: List[int],
        host_wallet_address: str
    ) -> str:
        """
        Complete an event on the blockchain.
        
        Args:
            blockchain_event_run_id: Blockchain event run ID
            attended_blockchain_booking_ids: List of blockchain booking IDs that attended
            host_wallet_address: Host's wallet address
        
        Returns:
            Transaction hash
        """
        try:
            # Build transaction
            tx = self.contract.functions.completeEvent(
                blockchain_event_run_id,
                attended_blockchain_booking_ids
            ).build_transaction({
                'from': self.platform_account.address,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.platform_account.address),
                'chainId': self.w3.eth.chain_id
            })
            
            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.platform_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for confirmation
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt['status'] != 1:
                raise Exception("Transaction failed")
            
            return tx_hash.hex()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to complete event on blockchain: {str(e)}"
            )

    async def cancel_event_onchain(
        self,
        blockchain_event_run_id: int,
        host_wallet_address: str
    ) -> str:
        """Cancel an event and refund all users."""
        self._ensure_connected()
        try:
            tx = self.contract.functions.cancelEvent(
                blockchain_event_run_id
            ).build_transaction({
                'from': self.platform_account.address,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.platform_account.address),
                'chainId': self.w3.eth.chain_id
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.platform_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt['status'] != 1:
                raise Exception("Transaction failed")
            
            return tx_hash.hex()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to cancel event on blockchain: {str(e)}"
            )

    async def get_host_events(self, host_wallet_address: str) -> List[int]:
        """Get all event run IDs for a host."""
        self._ensure_connected()
        try:
            checksum_address = Web3.to_checksum_address(host_wallet_address)
            event_ids = self.contract.functions.getHostEvents(checksum_address).call()
            return list(event_ids)
        except Exception as e:
            return []

    async def get_user_bookings(self, user_wallet_address: str) -> List[int]:
        """Get all booking IDs for a user."""
        self._ensure_connected()
        try:
            checksum_address = Web3.to_checksum_address(user_wallet_address)
            booking_ids = self.contract.functions.getUserBookings(checksum_address).call()
            return list(booking_ids)
        except Exception as e:
            return []

    def _parse_event_run_id_from_receipt(self, tx_receipt: dict) -> int:
        """
        Parse the event run ID from transaction logs.
        
        The createEventRun function emits an EventRunCreated event with the ID.
        """
        # Look for EventRunCreated event in logs
        for log in tx_receipt['logs']:
            try:
                # Decode the log (you'll need to add proper event decoding)
                # For now, we'll extract it from the transaction return value
                # In practice, you should decode the event properly
                pass
            except:
                continue
        
        # Fallback: Read from contract call (this won't work for transactions)
        # You'll need to implement proper event log parsing
        # For now, return 1 as placeholder
        # TODO: Implement proper event log parsing
        return 1


# Create service instance
blockchain_service = BlockchainService()

