// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IRouter {
    function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);
}

interface IAavePool {
    function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external;
}

contract ZablonFlashBot {
    address public immutable owner;
    // Aave V3 Polygon Pool Address (Direct Address - bypasses Provider to prevent revert)
    IAavePool public constant POOL = IAavePool(0x794a61358D6845594F94dc1DB02A252b5b4814aD);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner");
        _;
    }

    function setAllowances(address token, address spender) external onlyOwner {
        IERC20(token).approve(spender, type(uint256).max);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        // Decode the parameters for the trade
        (address r1, address r2, address[] memory p1, address[] memory p2) = abi.decode(params, (address, address, address[], address[]));
        
        // Execute the arbitrage
        uint[] memory res1 = IRouter(r1).swapExactTokensForTokens(amount, 0, p1, address(this), block.timestamp);
        uint[] memory res2 = IRouter(r2).swapExactTokensForTokens(res1[res1.length-1], 0, p2, address(this), block.timestamp);

        uint totalDebt = amount + premium;
        require(res2[res2.length-1] > totalDebt, "No Profit");

        // Repay Aave
        IERC20(asset).approve(address(POOL), totalDebt);
        return true;
    }

    function requestFlashLoan(address token, uint256 amount, bytes calldata params) external onlyOwner {
        POOL.flashLoanSimple(address(this), token, amount, params, 0);
    }

    function withdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(owner, IERC20(token).balanceOf(address(this)));
        }
    }

    receive() external payable {}
}