import styled from "styled-components";

export const Styles = styled.div`

    background-color: #202332;
    min-height: 500px !important;

    .nav-tabs .nav-item.show .nav-link, .nav-tabs .nav-link.active {
        background-color: transparent;
        border: 1px solid #ddd;
        color: #bbb7b7 !important;
    }

    .nav-link {
        font-size: 0.8rem !important;
        color: #bbb7b7 !important;
    }

    .btn-buy {
        padding: 0.4rem 0.5rem !important;
        font-size: 14px !important;
    }

    @media screen and (max-width: 576px) {
        min-height: 350px !important;
    }

    th, td {
        padding: 5px 10px;
        min-width: 7rem;
    }

    
`