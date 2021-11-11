pragma solidity ^0.8.7;

contract Vmeste {

    struct User {
        string name;
        string avatarURL;
        string info;
        uint events;
        uint eventsCreated;
        bool exists;
    }

    struct Event {
        address payable creator;

        uint x;
        uint y;

        string name;
        string description;
        string imageURL;
        string addressName;

        uint price;

        uint ticketsTotal;
        uint ticketsLeft;

        //uint timestampCreated;
        uint timestampStart;

        bool verify;

        bool closed;
        
        bool haveTickets;
        
        uint id;
    }

    struct Review {
        address author;
        uint8 rate;
        string text;
        bool deleted;
    }

    struct Ticket {
        uint tokenId;
        string ipfsHash;
        uint eventID;
    }

    mapping(address => User) private users;

    mapping(address => Review[]) private reviews;

    mapping(address => Ticket[]) private tickets;
    
    mapping(uint => string[]) private verifyHashes;
    mapping(uint => string[]) private ticketsHashes;

    uint private ticketsCount;

    Event[] private events;

    address public owner;

    event NewEventEvent(uint eventID);

    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function getLiveEvents() public onlyOwner view returns (Event[] memory) {
        uint length = 0;

        bool[] memory checker = new bool[](events.length);

        for (uint i = 0; i < events.length; i++) {
            if (events[i].timestampStart > block.timestamp) {
                checker[i] = true;
                length++;
            }
        }

        Event[] memory _events = new Event[](length);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (checker[i]) {
                _events[j] = events[i];
                j++;
            }
        }
        return _events;
    }

    function getUserEvents(address userAddress) public onlyOwner view returns (Event[] memory) {
        uint length = 0;

        bool[] memory checker = new bool[](events.length);

        for (uint i = 0; i < events.length; i++) {
            if (events[i].creator == userAddress) {
                checker[i] = true;
                length++;
            }
        }

        Event[] memory _events = new Event[](length);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (checker[i]) {
                _events[j] = events[i];
                j++;
            }
        }
        return _events;
    }

    function getUser(address userAddress) public onlyOwner view returns (User memory) {
        return users[userAddress];
    }

    function getReviews(address userAddress) public onlyOwner view returns (Review[] memory) {
        return reviews[userAddress];
    }

    function getTickets(address userAddress) public onlyOwner view returns (Ticket[] memory) {
        return tickets[userAddress];
    }

    function getEvent(uint eventID) public onlyOwner view returns (Event memory) {
        return events[eventID];
    }

    function login(address _userAddress) onlyOwner public {
        if (!users[_userAddress].exists) {
            users[_userAddress] = User({
            name : "User",
            avatarURL : "",
            info : "",
            events : 0,
            eventsCreated : 0,
            exists : true
            });
        }
    }


    function updateUserProfile(
        address userAddress,
        string calldata _name,
        string calldata _avatarURL,
        string calldata _info
    ) public onlyOwner {
        users[userAddress].name = _name;
        users[userAddress].avatarURL = _avatarURL;
        users[userAddress].info = _info;
    }

    function createEvent(
        address payable userAddress,
        uint _ticketsCount,
        uint _x,
        uint _y,
        uint _timestampStart,
        string[] calldata info,
        uint _price,
        bool _verify
    ) public onlyOwner returns(uint) {
        
        // string calldata _name,
        // string calldata _addressName,
        // string calldata _description,
        // string calldata _imageURL,
        events.push( Event({
            id: events.length,
            creator : userAddress,
            x : _x,
            y : _y,

            name : info[0],
            description : info[1],
            imageURL : info[2],
            addressName : info[3],

            price : _price,

            ticketsTotal : _ticketsCount,
            ticketsLeft : _ticketsCount,

            //timestampCreated : block.timestamp,
            timestampStart : _timestampStart,

            verify : _verify,

            closed : false,
            
            haveTickets: false
        }));

        emit NewEventEvent(events.length - 1);
        
        return events.length - 1;
    }
    
    function addHashes(uint eventID, string[] memory _ticketsHashes, string[] memory _verifyHashes) public onlyOwner {
        ticketsHashes[eventID] = _ticketsHashes;
        verifyHashes[eventID] = _verifyHashes;
    }

    function buyTicket(uint _eventID) public payable {
        tickets[msg.sender].push(Ticket({
            tokenId : ticketsCount,
            ipfsHash : ticketsHashes[_eventID][events[_eventID].ticketsTotal - events[_eventID].ticketsLeft],
            eventID : _eventID
        }));
        ticketsCount++;

        events[_eventID].ticketsLeft--;

        
        events[_eventID].creator.transfer(events[_eventID].price);
        
    }

    function checkTicket(uint eventID, string memory verifyHash) public view returns(bool) {
        for (uint i = 0;i < events[eventID].ticketsTotal;i++) {
            if (keccak256(abi.encodePacked(verifyHashes[eventID][i])) == keccak256(abi.encodePacked(verifyHash))) return true;
        }
        return false;
    }


}