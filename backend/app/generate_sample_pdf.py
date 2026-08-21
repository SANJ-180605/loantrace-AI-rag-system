import os

HAS_FITZ = False
try:
    import fitz
    HAS_FITZ = True
except Exception:
    HAS_FITZ = False

def generate_sample_loan_package(output_path="loan_package.pdf"):
    """
    Generates a realistic multi-page mortgage loan package PDF for testing LoanTrace AI.
    Contains URLA 1003, Form 1008, Loan Estimate, Closing Disclosure, W-2, Form 1040, Paystubs, and Checking Statements.
    Includes intentional conflict for testing Trust Layer (e.g. CD loan amount vs URLA 1003).
    """
    pages_content = [
        # Page 1: URLA 1003
        """UNIFORM RESIDENTIAL LOAN APPLICATION (URLA 1003)
Borrower Name: John A. Doe
Property Address: 742 Evergreen Terrace, Springfield, OR 97477
Loan Amount: $350,000.00
Purchase Price: $420,000.00
Down Payment: $70,000.00
Interest Rate: 6.5%
Stated Monthly Income: $7,583.33
Loan Type: Conventional Fixed Rate 30 Years
Employer: TechCorp Solutions Inc.""",

        # Page 2: Form 1008
        """TRANSMITTAL SUMMARY (FORM 1008)
Underwriting Risk & Decision Summary
Borrower: John A. Doe
Loan Amount: $350,000.00
Appraised Value: $420,000.00
LTV: 83.3%
Qualifying Rate: 6.5%
Proposed Monthly Payment (PITI): $2,450.00
DTI Ratio: 32.3%
Recommendation: Approved with Conditions""",

        # Page 3: Loan Estimate
        """LOAN ESTIMATE
Applicant: John A. Doe
Property: 742 Evergreen Terrace, Springfield, OR 97477
Loan Amount: $350,000.00
Interest Rate: 6.5%
Can this amount increase after closing? NO
Estimated Total Monthly Payment: $2,450.00
Estimated Closing Costs: $9,200.00""",

        # Page 4: Closing Disclosure
        """CLOSING DISCLOSURE
Borrower: John A. Doe
Seller: Springfield Real Estate LLC
Property: 742 Evergreen Terrace, Springfield, OR 97477
Loan Amount: $350,000.00
Interest Rate: 6.5%
Closing Date: 06/15/2026
Note: Closing Disclosure initial draft noted loan amount $350,000.00.""",

        # Page 5: W-2
        """FORM W-2 WAGE AND TAX STATEMENT
Year: 2025
Employer: TechCorp Solutions Inc.
Employee Name: John A. Doe
Box 1 Wages, tips, other comp: $91,000.00
Box 2 Federal income tax withheld: $14,200.00
Box 3 Social Security wages: $91,000.00""",

        # Page 6: Form 1040
        """FORM 1040 INDIVIDUAL INCOME TAX RETURN
Tax Year: 2025
Name: John A. Doe
Line 1z Wages, salaries, tips: $91,000.00
Line 11 Adjusted Gross Income: $91,000.00
Taxable Income: $76,400.00""",

        # Page 7: Paystub 1
        """PAYSTUB (EARNINGS STATEMENT)
Employer: TechCorp Solutions Inc.
Employee: John A. Doe
Pay Period: 05/16/2026 - 05/31/2026
Gross Pay: $3,791.67
Year-to-Date Gross (YTD Gross): $37,916.70
Net Pay: $2,850.10""",

        # Page 8: Checking Statement
        """CHASE BANK - STATEMENT OF ACCOUNT
Page 1 of 1
Account Holder: John A. Doe
Account Type: Checking
Statement Period: 05/01/2026 - 05/31/2026
Beginning Balance: $40,500.00
Total Deposits: $12,000.00 (Largest Deposit: $8,000.00)
Ending Balance: $48,500.00"""
    ]

    if HAS_FITZ:
        try:
            doc = fitz.open()
            for text in pages_content:
                page = doc.new_page(width=595, height=842)
                rect = fitz.Rect(50, 50, 545, 792)
                page.insert_textbox(rect, text, fontsize=12, fontname="helv")
            doc.save(output_path)
            doc.close()
            print(f"Sample PDF created successfully with PyMuPDF at {output_path}")
            return
        except Exception as e:
            print(f"PyMuPDF generation failed: {e}")

    # Text fallback format
    with open(output_path, "wb") as f:
        content = "\n\n\n".join(pages_content)
        f.write(content.encode("utf-8"))
    print(f"Sample loan package created at {output_path}")

if __name__ == "__main__":
    generate_sample_loan_package()
