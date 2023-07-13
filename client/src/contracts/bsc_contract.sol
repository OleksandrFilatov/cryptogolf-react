// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CryptoGolf is
    ERC721("CryptoGolf", "GOLFPUNKS"),
    ERC721Enumerable,
    Ownable,
    Pausable
{
    using SafeMath for uint256;
    using Strings for uint256;

    struct OfferedPrice {
        address buyer;
        uint256 price;
        uint256 tokenType;
        uint256 date;
        uint256 status;
    }

    struct ListToken {
        uint256 tokenType; // 1: ETH or BNB, 2: GOLF Token
        uint256 tokenPrice;
    }

    struct LastSoldPrice {
        uint256 currency;
        uint256 price;
    }

    struct HighestOffer {
        uint256 currency;
        uint256 price;
    }

    event Mint(address indexed minter, uint256 tokenId, uint256 timestamp);

    event List(
        address indexed owner,
        uint256 tokenType,
        uint256 price,
        uint256 tokenId,
        uint256 timestamp
    );
    event List_Cancel(
        address indexed owner,
        uint256 tokenType,
        uint256 price,
        uint256 tokenId,
        uint256 timestamp
    );

    event Offer(
        address indexed buyer,
        address indexed owner,
        uint256 price,
        uint256 tokenType,
        uint256 tokenId,
        uint256 timestamp
    );
    event Offer_Cancelled(
        address indexed buyer,
        address indexed owner,
        uint256 price,
        uint256 tokenType,
        uint256 tokenId,
        uint256 timestamp
    );

    event Transfer(
        address indexed owner,
        address indexed buyer,
        uint256 tokenId,
        uint256 timestamp
    );
    event Sold(
        address indexed owner,
        address indexed buyer,
        uint256 tokenId,
        uint256 price,
        uint256 currency,
        uint256 timestamp
    );

    string private baseURI =
        "ipfs://QmZz4aqfJagLMNVwZLBYqV37ZEBr9pBcfzXAQs2XdgK2DP/";

    uint256 public BUY_LIMIT_PER_TX = 20;
    uint256 public MAX_NFT = 5000;
    uint256 public tokenPrice = 500000000000000000; // 0.5 BNB
    uint256 public reflectionFee = 5;
    address private golfContractAddress =
        0xC7C2A96bc0Fa74c5bdaeD142e2E540a8f119a791;

    // @notice A price of listed token id
    mapping(uint256 => mapping(address => ListToken)) public listedPrice;

    // @notice Array of offer info for token id
    mapping(uint256 => mapping(address => OfferedPrice[]))
        public offeredPricesOfToken;

    // @notice A highest offer price of token id
    mapping(uint256 => mapping(address => HighestOffer)) public highestOffer;

    // @notice A last sold price of token id
    mapping(uint256 => LastSoldPrice) public lastSoldPrice;

    mapping(uint256 => mapping(address => OfferedPrice[])) public buyers;

    constructor() {}

    function withdraw(address _to) public onlyOwner {
        uint256 balance = address(this).balance;
        payable(_to).transfer(balance);
    }

    function mintNFT(uint256 _numOfTokens, uint256 _timestamp) public payable {
        require(_numOfTokens <= BUY_LIMIT_PER_TX, "Can't mint above limit");
        require(
            totalSupply().add(_numOfTokens) <= MAX_NFT,
            "Purchase would exceed max supply of NFTs"
        );
        require(
            tokenPrice.mul(_numOfTokens) == msg.value,
            "Ether value sent is not correct"
        );

        for (uint256 i = 0; i < _numOfTokens; i++) {
            _safeMint(msg.sender, totalSupply() + 1 + i);

            emit Mint(msg.sender, totalSupply() + 1 + i, _timestamp);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        uint256 tempId = tokenId * 2;
        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(currentBaseURI, tempId.toString(), ".json")
                )
                : "";
    }

    function getTokenName() public view returns (string memory) {
        return ERC721.name();
    }

    function getSymbol() public view returns (string memory) {
        return ERC721.symbol();
    }

    function ownerOfToken(uint256 _tokenId) public view returns (address) {
        return ERC721.ownerOf(_tokenId);
    }

    function setTokenPrice(uint256 _tokenPrice) public onlyOwner {
        tokenPrice = _tokenPrice;
    }

    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    function setBaseURI(string memory _pBaseURI) external onlyOwner {
        baseURI = _pBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Standard functions to be overridden
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Marketing
    function setGolfContractAddress(address _addr) public onlyOwner {
        golfContractAddress = _addr;
    }

    function getGolfContractAddress() public view returns (address) {
        return golfContractAddress;
    }

    function setReflectionFee(uint256 _fee) public onlyOwner {
        reflectionFee = _fee;
    }

    function getReflectionFee() public view onlyOwner returns (uint256) {
        return reflectionFee;
    }

    function getOwnerTokens(address _owner)
        public
        view
        returns (string memory)
    {
        string memory json;

        json = "[";
        uint256 token_id = 0;
        for (uint256 i = 0; i < ERC721.balanceOf(_owner); i++) {
            token_id = ERC721Enumerable.tokenOfOwnerByIndex(_owner, i);
            json = string(
                abi.encodePacked(
                    json,
                    '{"tokenURI":"',
                    tokenURI(token_id),
                    '","listPrice":"',
                    listedPrice[token_id][_owner].tokenPrice.toString(),
                    '","listType":"',
                    listedPrice[token_id][_owner].tokenType.toString(),
                    '","highestOfferPrice":"',
                    highestOffer[token_id][_owner].price.toString(),
                    '","highestOfferType":"',
                    highestOffer[token_id][_owner].currency.toString(),
                    '","lastSoldPrice":"',
                    getLastSoldPrice(token_id).price.toString(),
                    '","lastSoldCurrency":"',
                    getLastSoldPrice(token_id).currency.toString(),
                    '"}'
                )
            );
            if (i < ERC721.balanceOf(_owner) - 1) {
                json = string(abi.encodePacked(json, ","));
            }
        }
        json = string(abi.encodePacked(json, "]"));
        return json;
    }

    function getAllTokens() public view returns (string memory) {
        string memory json;

        uint256 token_id = 0;
        address owner;
        json = "[";
        for (uint256 i = 0; i < totalSupply(); i++) {
            token_id = ERC721Enumerable.tokenByIndex(i);
            owner = ownerOfToken(token_id);

            json = string(
                abi.encodePacked(
                    json,
                    '{"tokenURI":"',
                    tokenURI(token_id),
                    // "\",\"hasOffer\":\"", hasOffer(token_id),
                    '","listPrice":"',
                    listedPrice[token_id][owner].tokenPrice.toString(),
                    '","listType":"',
                    listedPrice[token_id][owner].tokenType.toString(),
                    '","highestOfferPrice":"',
                    highestOffer[token_id][owner].price.toString(),
                    '","highestOfferType":"',
                    highestOffer[token_id][owner].currency.toString(),
                    '","lastSoldPrice":"',
                    getLastSoldPrice(token_id).price.toString(),
                    '","lastSoldCurrency":"',
                    getLastSoldPrice(token_id).currency.toString(),
                    '"}'
                )
            );
            if (i < totalSupply() - 1) {
                json = string(abi.encodePacked(json, ","));
            }
        }
        json = string(abi.encodePacked(json, "]"));
        return json;
    }

    function hasOffer(uint256 _tokenId) public view returns (bool) {
        address owner = ownerOfToken(_tokenId);
        return offeredPricesOfToken[_tokenId][owner].length > 0;
    }

    function getTokenDetail(uint256 _tokenId)
        public
        view
        returns (string memory)
    {
        string memory json;
        string memory uri = tokenURI(_tokenId);
        string memory tokenName = getTokenName();
        string memory tokenSymbol = getSymbol();
        LastSoldPrice memory data = getLastSoldPrice(_tokenId);
        HighestOffer memory highestPrice = getHighestOffer(_tokenId);

        json = string(
            abi.encodePacked(
                "[",
                '{"tokenURI":"',
                uri,
                '","tokenName":"',
                tokenName,
                '","tokenSymbol":"',
                tokenSymbol,
                '","lastSoldPrice":"',
                data.price.toString(),
                '","lastSoldCurrency":"',
                data.currency.toString(),
                '","highestOfferPrice":"',
                highestPrice.price.toString(),
                '","highestOfferType":"',
                highestPrice.currency.toString(),
                '"}',
                "]"
            )
        );
        return json;
    }

    function toAsciiString(bytes memory data)
        public
        pure
        returns (string memory)
    {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    // List for sell
    function setlistedPrice(
        uint256 _tokenId,
        uint256 _price,
        uint256 _type,
        uint256 _timestamp
    ) public {
        require(
            msg.sender == ownerOfToken(_tokenId),
            "ERC721: Not permission for this action"
        );
        address owner = ownerOfToken(_tokenId);

        listedPrice[_tokenId][owner] = ListToken(_type, _price);

        ERC721.approve(address(this), _tokenId);
        // if(_type == 2) {
        //     ERC20(golfContractAddress).approve(address(this), _price);
        // }

        emit List(msg.sender, _type, _price, _tokenId, _timestamp);
    }

    function getListedPrice(uint256 _tokenId)
        public
        view
        returns (ListToken memory)
    {
        address owner = ownerOfToken(_tokenId);
        return listedPrice[_tokenId][owner];
    }

    function removeFromListedPrice(uint256 _tokenId, uint256 _timestamp)
        public
    {
        address owner = ownerOfToken(_tokenId);
        require(msg.sender == owner, "Not permission for this action");

        ListToken memory data = listedPrice[_tokenId][owner];

        delete listedPrice[_tokenId][owner];

        ERC721.approve(address(0), _tokenId); //return token ownership

        for (
            uint256 i = 0;
            i < offeredPricesOfToken[_tokenId][owner].length;
            i++
        ) {
            delete offeredPricesOfToken[_tokenId][owner][i];
        }

        emit List_Cancel(
            msg.sender,
            data.tokenType,
            data.tokenPrice,
            _tokenId,
            _timestamp
        );
    }

    // Approve by owner
    function transferToken(
        address _to,
        uint256 _tokenId,
        uint256 _timestamp
    ) external {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        require(
            ownerOfToken(_tokenId) == msg.sender,
            "Token owner does not matched"
        );

        // ERC721.approve(_to, _tokenId);

        _transferFrom(msg.sender, _to, _tokenId, _timestamp);
    }

    function _transferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        uint256 _timestamp
    ) private {
        address owner = ownerOfToken(_tokenId);
        uint256 approvedPrice = 0;

        for (
            uint256 i = 0;
            i < offeredPricesOfToken[_tokenId][owner].length;
            i++
        ) {
            if (
                address(offeredPricesOfToken[_tokenId][owner][i].buyer) ==
                address(_to)
            ) {
                offeredPricesOfToken[_tokenId][owner][i].status = 1; //approved
                approvedPrice = offeredPricesOfToken[_tokenId][owner][i].price;
            } else {
                offeredPricesOfToken[_tokenId][owner][i].status = 2; //cancelled
                payable(offeredPricesOfToken[_tokenId][owner][i].buyer)
                    .transfer(offeredPricesOfToken[_tokenId][owner][i].price);
            }
        }

        ERC721.safeTransferFrom(_from, _to, _tokenId);
        emit Transfer(_from, _to, _tokenId, _timestamp);

        delete offeredPricesOfToken[_tokenId][owner];
        delete listedPrice[_tokenId][owner];

        splitBalance(_to, approvedPrice);
        lastSoldPrice[_tokenId] = LastSoldPrice(1, approvedPrice);

        emit Sold(_from, _to, _tokenId, approvedPrice, 1, _timestamp);
    }

    function approveTokenWithGolf(
        address _to,
        uint256 _tokenId,
        uint256 _timestamp
    ) external {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        address owner = ownerOfToken(_tokenId);

        require(owner == msg.sender, "Token owner does not matched");
        require(
            ERC20(golfContractAddress).allowance(_to, address(this)) > 0,
            "Not approved user"
        );

        ERC721.approve(_to, _tokenId);

        OfferedPrice[] memory data = offeredPricesOfToken[_tokenId][owner];
        uint256 approvedPrice = 0;

        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].buyer == _to) {
                data[i].status = 1; //approved
                approvedPrice = data[i].price;
                ERC20(golfContractAddress).transferFrom(
                    _to,
                    owner,
                    approvedPrice
                ); // transfer golf token from buyer to owner
            } else {
                data[i].status = 2; //cancelled
                ERC20(golfContractAddress).approve(address(0), data[i].price);
            }
        }

        ERC721.safeTransferFrom(msg.sender, _to, _tokenId);
        emit Transfer(msg.sender, _to, _tokenId, _timestamp);

        lastSoldPrice[_tokenId] = LastSoldPrice(2, approvedPrice);

        delete offeredPricesOfToken[_tokenId][owner];
        delete listedPrice[_tokenId][owner];

        emit Sold(msg.sender, _to, _tokenId, approvedPrice, 2, _timestamp);
    }

    function cancelOffer(
        address _to,
        uint256 _tokenId,
        uint256 _timestamp
    ) external {
        require(_exists(_tokenId), "Token not found");
        address owner = ownerOfToken(_tokenId);
        require(msg.sender == owner, "Not permission for this action");

        for (
            uint256 i = 0;
            i < offeredPricesOfToken[_tokenId][owner].length;
            i++
        ) {
            if (
                address(offeredPricesOfToken[_tokenId][owner][i].buyer) ==
                address(_to)
            ) {
                offeredPricesOfToken[_tokenId][owner][i].status = 2; //cancelled

                if (offeredPricesOfToken[_tokenId][owner][i].tokenType == 1) {
                    payable(offeredPricesOfToken[_tokenId][owner][i].buyer)
                        .transfer(
                            offeredPricesOfToken[_tokenId][owner][i].price
                        );
                }
                emit Offer_Cancelled(
                    _to,
                    owner,
                    offeredPricesOfToken[_tokenId][owner][i].price,
                    offeredPricesOfToken[_tokenId][owner][i].tokenType,
                    _tokenId,
                    _timestamp
                );

                delete offeredPricesOfToken[_tokenId][owner][i];
                break;
            }
        }
    }

    // Offer
    function placeOffer(uint256 _tokenId, uint256 _timestamp) public payable {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        require(
            msg.sender != ownerOfToken(_tokenId),
            "You can't buy your token"
        );

        address _owner = ownerOfToken(_tokenId);
        _setOfferedPrice(msg.sender, _tokenId, msg.value, 1, _timestamp);

        emit Offer(msg.sender, _owner, msg.value, 1, _tokenId, _timestamp);
    }

    function placeOfferWithGolf(
        uint256 _tokenId,
        uint256 _price,
        uint256 _timestamp
    ) public payable {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        require(
            msg.sender != ownerOfToken(_tokenId),
            "You can't buy your token"
        );
        require(
            ERC20(golfContractAddress).balanceOf(msg.sender) >= _price,
            "Inefficient GOLF funds"
        );

        address owner = ownerOfToken(_tokenId);
        ERC20(golfContractAddress).approve(address(this), _price);
        // ERC20(golfContractAddress).transferFrom(msg.sender, address(this), _price);

        _setOfferedPrice(msg.sender, _tokenId, _price, 2, _timestamp);

        emit Offer(msg.sender, owner, _price, 2, _tokenId, _timestamp);
    }

    function _setOfferedPrice(
        address _buyer,
        uint256 _tokenId,
        uint256 _price,
        uint256 _tokenType,
        uint256 _timestamp
    ) private {
        address owner = ownerOfToken(_tokenId);
        bool isExist = false;
        for (
            uint256 i = 0;
            i < offeredPricesOfToken[_tokenId][owner].length;
            i++
        ) {
            if (offeredPricesOfToken[_tokenId][owner][i].buyer == _buyer) {
                offeredPricesOfToken[_tokenId][owner][i].price = _price;
                offeredPricesOfToken[_tokenId][owner][i].tokenType = _tokenType;
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            offeredPricesOfToken[_tokenId][owner].push(
                OfferedPrice(_buyer, _price, _tokenType, _timestamp, 0)
            );
        }

        _setHighestOffer(_tokenId);
    }

    function _setHighestOffer(uint256 _tokenId) private {
        address owner = ownerOfToken(_tokenId);
        OfferedPrice[] memory data = offeredPricesOfToken[_tokenId][owner];
        uint256 maxPrice = data[0].price;
        uint256 offerType = data[0].tokenType;

        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].price > maxPrice) {
                maxPrice = data[i].price;
                offerType = data[i].tokenType;
            }
        }
        highestOffer[_tokenId][owner] = HighestOffer(offerType, maxPrice);
    }

    function getHighestOffer(uint256 _tokenId)
        public
        view
        returns (HighestOffer memory)
    {
        address tokenOwner = ownerOfToken(_tokenId);
        return highestOffer[_tokenId][tokenOwner];
    }

    function getOfferedPrices(uint256 _tokenId)
        public
        view
        returns (string memory)
    {
        address owner = ownerOfToken(_tokenId);
        OfferedPrice[] memory data = offeredPricesOfToken[_tokenId][owner];

        string memory json;
        string memory buyer;
        json = "[";

        for (uint256 i = 0; i < data.length; i++) {
            buyer = toAsciiString(abi.encodePacked(data[i].buyer));
            json = string(
                abi.encodePacked(
                    json,
                    '{"buyer":"',
                    buyer,
                    '","price":"',
                    data[i].price.toString(),
                    '","currency":"',
                    data[i].tokenType.toString(),
                    '","status":"',
                    data[i].status.toString(),
                    '","date":"',
                    data[i].date.toString(),
                    '"}'
                )
            );
            if (i < data.length - 1) {
                json = string(abi.encodePacked(json, ","));
            }
        }
        json = string(abi.encodePacked(json, "]"));
        return json;
    }

    function getLastSoldPrice(uint256 _tokenId)
        public
        view
        returns (LastSoldPrice memory)
    {
        return lastSoldPrice[_tokenId];
    }

    function splitBalance(address _to, uint256 amount) private {
        uint256 fee = (amount * reflectionFee) / 100;
        uint256 remain = amount - fee;
        // payable(address(this)).transfer(reflectionShare);
        payable(_to).transfer(remain);
    }

    // Buy
    function buyNFTWithGolf(
        uint256 _tokenId,
        uint256 _price,
        uint256 _timestamp
    ) public {
        require(_exists(_tokenId), "Token does not exist");
        require(
            ownerOfToken(_tokenId) != msg.sender,
            "Owner can't buy his token"
        );
        require(
            ERC20(golfContractAddress).balanceOf(msg.sender) >= _price,
            "Inefficient GOLF funds"
        );

        address owner = ownerOfToken(_tokenId);
        // ERC20(golfContractAddress).approve(address(this), _price);
        ERC20(golfContractAddress).transferFrom(
            msg.sender,
            owner,
            _price * 10**9
        );

        // ERC721().approve(msg.sender, _tokenId);
        ERC721(address(this)).transferFrom(owner, msg.sender, _tokenId);
        emit Transfer(owner, msg.sender, _tokenId, _timestamp);

        lastSoldPrice[_tokenId] = LastSoldPrice(2, _price);

        delete listedPrice[_tokenId][owner];
        delete offeredPricesOfToken[_tokenId][owner];

        emit Sold(msg.sender, owner, _tokenId, _price, 2, _timestamp);
    }

    function buyNFT(uint256 _tokenId, uint256 _timestamp) public payable {
        require(_exists(_tokenId), "Token does not exist");

        address owner = ownerOfToken(_tokenId);

        require(
            ownerOfToken(_tokenId) != msg.sender,
            "Owner can't buy his token"
        );
        require(
            listedPrice[_tokenId][owner].tokenPrice == msg.value,
            "Not correct price"
        );

        ERC721(address(this)).transferFrom(owner, msg.sender, _tokenId);
        emit Transfer(owner, msg.sender, _tokenId, _timestamp);

        splitBalance(owner, msg.value);
        lastSoldPrice[_tokenId] = LastSoldPrice(1, msg.value);

        delete listedPrice[_tokenId][owner];
        delete offeredPricesOfToken[_tokenId][owner];

        emit Sold(msg.sender, owner, _tokenId, msg.value, 1, _timestamp);
    }
}
