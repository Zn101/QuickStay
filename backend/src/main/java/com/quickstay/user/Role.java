package com.quickstay.user;

/** RESTAURANT_OWNER: chu nha hang; TOUR_OPERATOR: chu khu du lich / don vi to chuc tour. */
public enum Role {
    CUSTOMER, ADMIN, HOTEL_MANAGER, RESTAURANT_OWNER, TOUR_OPERATOR;

    /** Doi tac ben thu ba (duoc admin cap tai khoan, gan voi co so). */
    public boolean isPartner() {
        return this == HOTEL_MANAGER || this == RESTAURANT_OWNER || this == TOUR_OPERATOR;
    }
}
