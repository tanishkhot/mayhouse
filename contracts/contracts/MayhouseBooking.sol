// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MayhouseBooking
 * @dev Simplified booking contract for Mayhouse experiences
 * Uses off-chain event run references (UUIDs) instead of on-chain state
 */
contract MayhouseBooking is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant stakePercentage = 20; // 20% refundable stake
    uint256 public constant platformFeePercentage = 5; // 5% platform fee on forfeited stakes
    
    // State
    address public platformWallet;
    uint256 private _bookingIdCounter;
    
    // Booking status enum
    enum BookingStatus {
        Active,      // Booking confirmed, awaiting event
        Completed,   // User attended, stake returned
        NoShow,      // User didn't attend, stake forfeited
        Cancelled    // Booking cancelled, refunded
    }
    
    // Booking struct
    struct Booking {
        uint256 bookingId;
        address user;
        address host;
        string eventRunRef;  // UUID reference to off-chain event run
        uint256 ticketPrice;
        uint256 seatCount;
        uint256 userStake;
        uint256 eventTimestamp;
        BookingStatus status;
        uint256 createdAt;
    }
    
    // Storage
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public userBookings;
    mapping(address => uint256[]) public hostBookings;
    
    // Events
    event BookingCreated(
        uint256 indexed bookingId,
        address indexed user,
        address indexed host,
        string eventRunRef,
        uint256 ticketPrice,
        uint256 seatCount,
        uint256 userStake,
        uint256 eventTimestamp
    );
    
    event BookingCompleted(uint256 indexed bookingId, address indexed user);
    event BookingNoShow(uint256 indexed bookingId, address indexed user, uint256 forfeitedStake);
    event BookingCancelled(uint256 indexed bookingId, address indexed user, uint256 refundAmount);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    constructor(address _platformWallet) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create a new booking
     * @param _host Host wallet address
     * @param _eventRunRef Off-chain event run UUID
     * @param _ticketPrice Price per ticket in Wei
     * @param _seatCount Number of seats to book
     * @param _eventTimestamp Unix timestamp of event
     * @return bookingId The ID of the created booking
     */
    function createBooking(
        address _host,
        string memory _eventRunRef,
        uint256 _ticketPrice,
        uint256 _seatCount,
        uint256 _eventTimestamp
    ) external payable nonReentrant returns (uint256) {
        require(_host != address(0), "Invalid host address");
        require(bytes(_eventRunRef).length > 0, "Event run reference required");
        require(_seatCount > 0 && _seatCount <= 4, "Seat count must be 1-4");
        require(_eventTimestamp > block.timestamp, "Event must be in future");
        
        // Calculate costs
        uint256 totalTicketPrice = _ticketPrice * _seatCount;
        uint256 userStake = (totalTicketPrice * stakePercentage) / 100;
        uint256 totalCost = totalTicketPrice + userStake;
        
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Create booking
        uint256 bookingId = ++_bookingIdCounter;
        
        bookings[bookingId] = Booking({
            bookingId: bookingId,
            user: msg.sender,
            host: _host,
            eventRunRef: _eventRunRef,
            ticketPrice: _ticketPrice,
            seatCount: _seatCount,
            userStake: userStake,
            eventTimestamp: _eventTimestamp,
            status: BookingStatus.Active,
            createdAt: block.timestamp
        });
        
        userBookings[msg.sender].push(bookingId);
        hostBookings[_host].push(bookingId);
        
        // Transfer ticket price to host immediately
        (bool success, ) = payable(_host).call{value: totalTicketPrice}("");
        require(success, "Host payment failed");
        
        // Stake is held in contract
        
        emit BookingCreated(
            bookingId,
            msg.sender,
            _host,
            _eventRunRef,
            _ticketPrice,
            _seatCount,
            userStake,
            _eventTimestamp
        );
        
        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSuccess, "Refund failed");
        }
        
        return bookingId;
    }
    
    /**
     * @dev Mark booking as completed (user attended)
     * Can only be called by host after event
     * Returns stake to user
     */
    function completeBooking(uint256 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(booking.host == msg.sender, "Only host can complete");
        require(booking.status == BookingStatus.Active, "Booking not active");
        require(block.timestamp >= booking.eventTimestamp, "Event not yet occurred");
        
        booking.status = BookingStatus.Completed;
        
        // Return stake to user
        (bool success, ) = payable(booking.user).call{value: booking.userStake}("");
        require(success, "Stake return failed");
        
        emit BookingCompleted(_bookingId, booking.user);
    }
    
    /**
     * @dev Mark booking as no-show
     * Can only be called by host after event
     * Forfeits user's stake (95% to host, 5% to platform)
     */
    function markNoShow(uint256 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(booking.host == msg.sender, "Only host can mark no-show");
        require(booking.status == BookingStatus.Active, "Booking not active");
        require(block.timestamp >= booking.eventTimestamp, "Event not yet occurred");
        
        booking.status = BookingStatus.NoShow;
        
        // Calculate fee split
        uint256 platformFee = (booking.userStake * platformFeePercentage) / 100;
        uint256 hostAmount = booking.userStake - platformFee;
        
        // Transfer forfeited stake
        (bool hostSuccess, ) = payable(booking.host).call{value: hostAmount}("");
        require(hostSuccess, "Host payment failed");
        
        (bool platformSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        require(platformSuccess, "Platform payment failed");
        
        emit BookingNoShow(_bookingId, booking.user, booking.userStake);
    }
    
    /**
     * @dev Cancel booking (before event)
     * Returns full payment + stake to user
     */
    function cancelBooking(uint256 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(booking.user == msg.sender, "Only user can cancel");
        require(booking.status == BookingStatus.Active, "Booking not active");
        require(block.timestamp < booking.eventTimestamp, "Cannot cancel after event");
        
        booking.status = BookingStatus.Cancelled;
        
        // Calculate refund (user gets stake back, but host keeps ticket price)
        uint256 refundAmount = booking.userStake;
        
        (bool success, ) = payable(booking.user).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit BookingCancelled(_bookingId, booking.user, refundAmount);
    }
    
    /**
     * @dev Calculate booking cost (view function)
     */
    function calculateBookingCost(
        uint256 _ticketPrice,
        uint256 _seatCount
    ) external pure returns (uint256 payment, uint256 stake, uint256 total) {
        payment = _ticketPrice * _seatCount;
        stake = (payment * stakePercentage) / 100;
        total = payment + stake;
        return (payment, stake, total);
    }
    
    /**
     * @dev Get all booking IDs for a user
     */
    function getUserBookings(address _user) external view returns (uint256[] memory) {
        return userBookings[_user];
    }
    
    /**
     * @dev Get all booking IDs for a host
     */
    function getHostBookings(address _host) external view returns (uint256[] memory) {
        return hostBookings[_host];
    }
    
    /**
     * @dev Get booking details
     */
    function getBooking(uint256 _bookingId) external view returns (Booking memory) {
        return bookings[_bookingId];
    }
    
    /**
     * @dev Update platform wallet (owner only)
     */
    function updatePlatformWallet(address _newPlatformWallet) external onlyOwner {
        require(_newPlatformWallet != address(0), "Invalid address");
        address oldWallet = platformWallet;
        platformWallet = _newPlatformWallet;
        emit PlatformWalletUpdated(oldWallet, _newPlatformWallet);
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     * Only to be used in case of contract upgrade or emergency
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Receive function
    receive() external payable {}
}

