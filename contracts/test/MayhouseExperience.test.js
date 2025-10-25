const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MayhouseExperience", function () {
  let contract;
  let owner, host, user1, user2;
  const PRICE_PER_SEAT = ethers.parseEther("0.1"); // 0.1 ETH
  const MAX_SEATS = 4;
  const STAKE_PERCENTAGE = 20;
  
  beforeEach(async function () {
    [owner, host, user1, user2] = await ethers.getSigners();
    
    const MayhouseExperience = await ethers.getContractFactory("MayhouseExperience");
    contract = await MayhouseExperience.deploy();
    await contract.waitForDeployment();
  });
  
  describe("Event Creation", function () {
    it("Should allow host to create event with correct stake", async function () {
      const futureTime = (await time.latest()) + 86400; // +1 day
      const requiredStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      
      await expect(
        contract.connect(host).createEventRun(
          "exp_123",
          PRICE_PER_SEAT,
          MAX_SEATS,
          futureTime,
          { value: requiredStake }
        )
      ).to.emit(contract, "EventRunCreated");
      
      const eventRun = await contract.getEventRun(1);
      expect(eventRun.host).to.equal(host.address);
      expect(eventRun.pricePerSeat).to.equal(PRICE_PER_SEAT);
      expect(eventRun.maxSeats).to.equal(MAX_SEATS);
    });
    
    it("Should reject event creation with insufficient stake", async function () {
      const futureTime = (await time.latest()) + 86400;
      const requiredStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      const insufficientStake = requiredStake / BigInt(2);
      
      await expect(
        contract.connect(host).createEventRun(
          "exp_123",
          PRICE_PER_SEAT,
          MAX_SEATS,
          futureTime,
          { value: insufficientStake }
        )
      ).to.be.revertedWith("Insufficient stake amount");
    });
  });
  
  describe("Booking", function () {
    let eventRunId;
    let futureTime;
    
    beforeEach(async function () {
      futureTime = (await time.latest()) + 86400;
      const requiredStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      
      const tx = await contract.connect(host).createEventRun(
        "exp_123",
        PRICE_PER_SEAT,
        MAX_SEATS,
        futureTime,
        { value: requiredStake }
      );
      const receipt = await tx.wait();
      eventRunId = 1; // First event
    });
    
    it("Should allow user to book with payment + stake", async function () {
      const seatCount = 2;
      const payment = PRICE_PER_SEAT * BigInt(seatCount);
      const stake = (payment * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      const total = payment + stake;
      
      await expect(
        contract.connect(user1).bookEvent(eventRunId, seatCount, { value: total })
      ).to.emit(contract, "BookingCreated");
      
      const booking = await contract.getBooking(1);
      expect(booking.user).to.equal(user1.address);
      expect(booking.seatCount).to.equal(seatCount);
      expect(booking.totalPayment).to.equal(payment);
      expect(booking.userStake).to.equal(stake);
    });
    
    it("Should reject booking with insufficient payment", async function () {
      const seatCount = 2;
      const payment = PRICE_PER_SEAT * BigInt(seatCount);
      const insufficient = payment; // Missing stake
      
      await expect(
        contract.connect(user1).bookEvent(eventRunId, seatCount, { value: insufficient })
      ).to.be.revertedWith("Insufficient payment + stake");
    });
    
    it("Should reject booking more seats than available", async function () {
      const seatCount = MAX_SEATS + 1;
      const payment = PRICE_PER_SEAT * BigInt(seatCount);
      const stake = (payment * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      const total = payment + stake;
      
      await expect(
        contract.connect(user1).bookEvent(eventRunId, seatCount, { value: total })
      ).to.be.revertedWith("Not enough seats available");
    });
  });
  
  describe("Event Completion", function () {
    let eventRunId, bookingId1, bookingId2;
    let futureTime;
    
    beforeEach(async function () {
      // Create event
      futureTime = (await time.latest()) + 86400;
      const hostStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      
      await contract.connect(host).createEventRun(
        "exp_123",
        PRICE_PER_SEAT,
        MAX_SEATS,
        futureTime,
        { value: hostStake }
      );
      eventRunId = 1;
      
      // User1 books 2 seats
      const payment1 = PRICE_PER_SEAT * BigInt(2);
      const stake1 = (payment1 * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      await contract.connect(user1).bookEvent(eventRunId, 2, { value: payment1 + stake1 });
      bookingId1 = 1;
      
      // User2 books 2 seats
      const payment2 = PRICE_PER_SEAT * BigInt(2);
      const stake2 = (payment2 * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      await contract.connect(user2).bookEvent(eventRunId, 2, { value: payment2 + stake2 });
      bookingId2 = 2;
      
      // Fast forward past event time
      await time.increaseTo(futureTime + 1);
    });
    
    it("Should complete event and return stakes to attendees", async function () {
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
      const user2BalanceBefore = await ethers.provider.getBalance(user2.address);
      const hostBalanceBefore = await ethers.provider.getBalance(host.address);
      
      await contract.connect(host).completeEvent(eventRunId, [bookingId1, bookingId2]);
      
      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
      const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
      const hostBalanceAfter = await ethers.provider.getBalance(host.address);
      
      // Users should get stakes back
      const expectedStake = (PRICE_PER_SEAT * BigInt(2) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(expectedStake);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(expectedStake);
      
      // Host should receive payment + stake back (minus platform fee and gas)
      expect(hostBalanceAfter).to.be.gt(hostBalanceBefore);
    });
    
    it("Should forfeit stake for no-shows", async function () {
      const user2BalanceBefore = await ethers.provider.getBalance(user2.address);
      
      // Only user1 attended
      await contract.connect(host).completeEvent(eventRunId, [bookingId1]);
      
      const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
      
      // User2 should NOT get stake back (no-show)
      expect(user2BalanceAfter).to.equal(user2BalanceBefore);
      
      const booking2 = await contract.getBooking(bookingId2);
      expect(booking2.status).to.equal(2); // NoShow status
    });
  });
  
  describe("Event Cancellation", function () {
    it("Should refund all bookings when event is cancelled", async function () {
      // Create and book event
      const futureTime = (await time.latest()) + 86400;
      const hostStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      
      await contract.connect(host).createEventRun(
        "exp_123",
        PRICE_PER_SEAT,
        MAX_SEATS,
        futureTime,
        { value: hostStake }
      );
      
      const payment = PRICE_PER_SEAT * BigInt(2);
      const stake = (payment * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      await contract.connect(user1).bookEvent(1, 2, { value: payment + stake });
      
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
      
      // Cancel event
      await contract.connect(host).cancelEvent(1);
      
      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
      
      // User should get full refund
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(payment + stake);
    });
  });
  
  describe("View Functions", function () {
    it("Should calculate booking cost correctly", async function () {
      const futureTime = (await time.latest()) + 86400;
      const hostStake = (PRICE_PER_SEAT * BigInt(MAX_SEATS) * BigInt(STAKE_PERCENTAGE)) / BigInt(100);
      
      await contract.connect(host).createEventRun(
        "exp_123",
        PRICE_PER_SEAT,
        MAX_SEATS,
        futureTime,
        { value: hostStake }
      );
      
      const [payment, stake, total] = await contract.calculateBookingCost(1, 2);
      
      expect(payment).to.equal(PRICE_PER_SEAT * BigInt(2));
      expect(stake).to.equal((payment * BigInt(STAKE_PERCENTAGE)) / BigInt(100));
      expect(total).to.equal(payment + stake);
    });
  });
});

