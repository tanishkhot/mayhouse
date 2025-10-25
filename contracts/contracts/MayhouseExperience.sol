// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MayhouseExperience
 * @notice Smart contract for Mayhouse experience bookings with staking mechanism
 * @dev Both hosts and users stake funds to ensure commitment
 */
contract MayhouseExperience {
    
    // ============ State Variables ============
    
    address public owner; // Platform owner
    uint256 public platformFeePercentage = 5; // 5% platform fee
    uint256 public stakePercentage = 20; // 20% stake requirement
    
    uint256 private eventRunCounter;
    
    // ============ Structs ============
    
    enum EventStatus {
        Created,      // Host created and staked
        Active,       // Accepting bookings
        Full,         // All seats booked
        Completed,    // Event finished, stakes released
        Cancelled     // Event cancelled, refunds issued
    }
    
    enum BookingStatus {
        Active,       // Booking confirmed, payment + stake held
        Completed,    // Attended event, stake returned
        NoShow,       // Didn't attend, stake forfeited
        Cancelled     // Booking cancelled, refund issued
    }
    
    struct EventRun {
        uint256 eventRunId;
        address host;
        string experienceId;          // Off-chain reference
        uint256 pricePerSeat;         // In wei
        uint256 maxSeats;
        uint256 seatsBooked;
        uint256 hostStake;            // Total stake from host
        uint256 eventTimestamp;       // When event happens
        EventStatus status;
        bool hostStakeWithdrawn;
        uint256 createdAt;
    }
    
    struct Booking {
        uint256 bookingId;
        uint256 eventRunId;
        address user;
        uint256 seatCount;
        uint256 totalPayment;         // Ticket price only
        uint256 userStake;            // 20% stake
        BookingStatus status;
        uint256 bookedAt;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => EventRun) public eventRuns;
    mapping(uint256 => Booking) public bookings;
    mapping(uint256 => uint256[]) public eventRunBookings; // eventRunId => booking IDs
    mapping(address => uint256[]) public userBookings; // user address => booking IDs
    mapping(address => uint256[]) public hostEventRuns; // host address => eventRun IDs
    
    uint256 private bookingCounter;
    
    // ============ Events ============
    
    event EventRunCreated(
        uint256 indexed eventRunId,
        address indexed host,
        string experienceId,
        uint256 pricePerSeat,
        uint256 maxSeats,
        uint256 hostStake
    );
    
    event BookingCreated(
        uint256 indexed bookingId,
        uint256 indexed eventRunId,
        address indexed user,
        uint256 seatCount,
        uint256 totalPayment,
        uint256 userStake
    );
    
    event EventCompleted(
        uint256 indexed eventRunId,
        uint256 hostPayout,
        uint256 hostStakeReturned
    );
    
    event BookingCompleted(
        uint256 indexed bookingId,
        address indexed user,
        uint256 stakeReturned
    );
    
    event BookingNoShow(
        uint256 indexed bookingId,
        address indexed user,
        uint256 stakeForfeit
    );
    
    event EventCancelled(
        uint256 indexed eventRunId,
        uint256 refundsIssued
    );
    
    event StakeWithdrawn(
        address indexed recipient,
        uint256 amount,
        string stakeType
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyHost(uint256 _eventRunId) {
        require(
            eventRuns[_eventRunId].host == msg.sender,
            "Only host can call this"
        );
        _;
    }
    
    modifier eventExists(uint256 _eventRunId) {
        require(
            eventRuns[_eventRunId].host != address(0),
            "Event run does not exist"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Host Functions ============
    
    /**
     * @notice Host creates an event run and stakes required amount
     * @param _experienceId Off-chain experience reference
     * @param _pricePerSeat Price per seat in wei
     * @param _maxSeats Maximum number of seats
     * @param _eventTimestamp When the event will occur
     */
    function createEventRun(
        string memory _experienceId,
        uint256 _pricePerSeat,
        uint256 _maxSeats,
        uint256 _eventTimestamp
    ) external payable returns (uint256) {
        require(_pricePerSeat > 0, "Price must be greater than 0");
        require(_maxSeats > 0, "Must have at least 1 seat");
        require(
            _eventTimestamp > block.timestamp,
            "Event must be in the future"
        );
        
        // Calculate required host stake (20% of total event value)
        uint256 requiredStake = (_pricePerSeat * _maxSeats * stakePercentage) / 100;
        require(msg.value >= requiredStake, "Insufficient stake amount");
        
        eventRunCounter++;
        uint256 eventRunId = eventRunCounter;
        
        eventRuns[eventRunId] = EventRun({
            eventRunId: eventRunId,
            host: msg.sender,
            experienceId: _experienceId,
            pricePerSeat: _pricePerSeat,
            maxSeats: _maxSeats,
            seatsBooked: 0,
            hostStake: msg.value,
            eventTimestamp: _eventTimestamp,
            status: EventStatus.Active,
            hostStakeWithdrawn: false,
            createdAt: block.timestamp
        });
        
        hostEventRuns[msg.sender].push(eventRunId);
        
        emit EventRunCreated(
            eventRunId,
            msg.sender,
            _experienceId,
            _pricePerSeat,
            _maxSeats,
            msg.value
        );
        
        return eventRunId;
    }
    
    // ============ User Functions ============
    
    /**
     * @notice User books seats for an event (payment + stake)
     * @param _eventRunId The event run to book
     * @param _seatCount Number of seats to book
     */
    function bookEvent(uint256 _eventRunId, uint256 _seatCount)
        external
        payable
        eventExists(_eventRunId)
        returns (uint256)
    {
        EventRun storage eventRun = eventRuns[_eventRunId];
        
        require(
            eventRun.status == EventStatus.Active,
            "Event is not accepting bookings"
        );
        require(_seatCount > 0, "Must book at least 1 seat");
        require(
            eventRun.seatsBooked + _seatCount <= eventRun.maxSeats,
            "Not enough seats available"
        );
        require(
            block.timestamp < eventRun.eventTimestamp,
            "Event has already occurred"
        );
        
        // Calculate payment and stake
        uint256 totalPayment = eventRun.pricePerSeat * _seatCount;
        uint256 requiredStake = (totalPayment * stakePercentage) / 100;
        uint256 totalRequired = totalPayment + requiredStake;
        
        require(msg.value >= totalRequired, "Insufficient payment + stake");
        
        bookingCounter++;
        uint256 bookingId = bookingCounter;
        
        bookings[bookingId] = Booking({
            bookingId: bookingId,
            eventRunId: _eventRunId,
            user: msg.sender,
            seatCount: _seatCount,
            totalPayment: totalPayment,
            userStake: requiredStake,
            status: BookingStatus.Active,
            bookedAt: block.timestamp
        });
        
        eventRun.seatsBooked += _seatCount;
        
        // Update status if fully booked
        if (eventRun.seatsBooked == eventRun.maxSeats) {
            eventRun.status = EventStatus.Full;
        }
        
        eventRunBookings[_eventRunId].push(bookingId);
        userBookings[msg.sender].push(bookingId);
        
        emit BookingCreated(
            bookingId,
            _eventRunId,
            msg.sender,
            _seatCount,
            totalPayment,
            requiredStake
        );
        
        return bookingId;
    }
    
    // ============ Event Completion Functions ============
    
    /**
     * @notice Complete event and mark attendees (called by host or platform)
     * @param _eventRunId The event run that was completed
     * @param _attendedBookingIds Booking IDs of users who attended
     */
    function completeEvent(
        uint256 _eventRunId,
        uint256[] calldata _attendedBookingIds
    ) external eventExists(_eventRunId) {
        EventRun storage eventRun = eventRuns[_eventRunId];
        
        require(
            msg.sender == eventRun.host || msg.sender == owner,
            "Only host or owner can complete event"
        );
        require(
            block.timestamp >= eventRun.eventTimestamp,
            "Event has not occurred yet"
        );
        require(
            eventRun.status != EventStatus.Completed &&
            eventRun.status != EventStatus.Cancelled,
            "Event already finalized"
        );
        
        // Mark attended bookings
        for (uint256 i = 0; i < _attendedBookingIds.length; i++) {
            uint256 bookingId = _attendedBookingIds[i];
            Booking storage booking = bookings[bookingId];
            
            require(
                booking.eventRunId == _eventRunId,
                "Booking not for this event"
            );
            require(
                booking.status == BookingStatus.Active,
                "Booking not active"
            );
            
            booking.status = BookingStatus.Completed;
            
            // Return user stake
            payable(booking.user).transfer(booking.userStake);
            
            emit BookingCompleted(bookingId, booking.user, booking.userStake);
        }
        
        // Mark no-shows (bookings not in attended list)
        uint256[] memory allBookings = eventRunBookings[_eventRunId];
        for (uint256 i = 0; i < allBookings.length; i++) {
            uint256 bookingId = allBookings[i];
            Booking storage booking = bookings[bookingId];
            
            if (booking.status == BookingStatus.Active) {
                // Not in attended list = no-show
                booking.status = BookingStatus.NoShow;
                // Stake is forfeited (stays in contract for platform)
                
                emit BookingNoShow(bookingId, booking.user, booking.userStake);
            }
        }
        
        // Calculate host payout
        uint256 totalRevenue = 0;
        for (uint256 i = 0; i < allBookings.length; i++) {
            totalRevenue += bookings[allBookings[i]].totalPayment;
        }
        
        uint256 platformFee = (totalRevenue * platformFeePercentage) / 100;
        uint256 hostPayout = totalRevenue - platformFee;
        
        // Transfer host payout
        payable(eventRun.host).transfer(hostPayout);
        
        // Return host stake
        payable(eventRun.host).transfer(eventRun.hostStake);
        eventRun.hostStakeWithdrawn = true;
        
        eventRun.status = EventStatus.Completed;
        
        emit EventCompleted(_eventRunId, hostPayout, eventRun.hostStake);
    }
    
    // ============ Cancellation Functions ============
    
    /**
     * @notice Cancel event and refund all bookings
     * @param _eventRunId Event to cancel
     */
    function cancelEvent(uint256 _eventRunId)
        external
        onlyHost(_eventRunId)
        eventExists(_eventRunId)
    {
        EventRun storage eventRun = eventRuns[_eventRunId];
        
        require(
            eventRun.status != EventStatus.Completed &&
            eventRun.status != EventStatus.Cancelled,
            "Event already finalized"
        );
        
        // Refund all bookings
        uint256[] memory allBookings = eventRunBookings[_eventRunId];
        uint256 totalRefunded = 0;
        
        for (uint256 i = 0; i < allBookings.length; i++) {
            uint256 bookingId = allBookings[i];
            Booking storage booking = bookings[bookingId];
            
            if (booking.status == BookingStatus.Active) {
                // Refund payment + stake
                uint256 refundAmount = booking.totalPayment + booking.userStake;
                payable(booking.user).transfer(refundAmount);
                booking.status = BookingStatus.Cancelled;
                totalRefunded += refundAmount;
            }
        }
        
        // Return host stake
        payable(eventRun.host).transfer(eventRun.hostStake);
        eventRun.hostStakeWithdrawn = true;
        
        eventRun.status = EventStatus.Cancelled;
        
        emit EventCancelled(_eventRunId, totalRefunded);
    }
    
    // ============ View Functions ============
    
    function getEventRun(uint256 _eventRunId)
        external
        view
        returns (EventRun memory)
    {
        return eventRuns[_eventRunId];
    }
    
    function getBooking(uint256 _bookingId)
        external
        view
        returns (Booking memory)
    {
        return bookings[_bookingId];
    }
    
    function getEventBookings(uint256 _eventRunId)
        external
        view
        returns (uint256[] memory)
    {
        return eventRunBookings[_eventRunId];
    }
    
    function getUserBookings(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userBookings[_user];
    }
    
    function getHostEvents(address _host)
        external
        view
        returns (uint256[] memory)
    {
        return hostEventRuns[_host];
    }
    
    function calculateRequiredStake(uint256 _pricePerSeat, uint256 _seats)
        public
        view
        returns (uint256)
    {
        return (_pricePerSeat * _seats * stakePercentage) / 100;
    }
    
    function calculateBookingCost(uint256 _eventRunId, uint256 _seatCount)
        external
        view
        eventExists(_eventRunId)
        returns (uint256 payment, uint256 stake, uint256 total)
    {
        EventRun memory eventRun = eventRuns[_eventRunId];
        payment = eventRun.pricePerSeat * _seatCount;
        stake = (payment * stakePercentage) / 100;
        total = payment + stake;
    }
    
    // ============ Admin Functions ============
    
    function updatePlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10, "Fee cannot exceed 10%");
        platformFeePercentage = _newFeePercentage;
    }
    
    function updateStakePercentage(uint256 _newStakePercentage) external onlyOwner {
        require(_newStakePercentage <= 50, "Stake cannot exceed 50%");
        stakePercentage = _newStakePercentage;
    }
    
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner).transfer(balance);
    }
    
    // ============ Emergency Functions ============
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}

