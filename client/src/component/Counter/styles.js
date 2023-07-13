import styled from "styled-components";

export const Styles = styled.div`

    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
    background-color: #202332 !important;

    .counter-box {
        border: 1px solid #52cc83;
        border-radius: 20px;
        font-size: 3rem !important;
        width: 125px !important;
    }

    .counter-box .text {
        font-size: 1rem !important;
    }

    .counter-wrapper {
        background-color: #202332;
    }

    @media screen and (max-width: 991px) {
        .counter-box {
            width: 110px !important;
        }
    }

    @media screen and (max-width: 576px) {
        .counter-box {
            width: 90px !important;
        }
    }

`