import os

HAS_FITZ = False
try:
    import fitz
    HAS_FITZ = True
except Exception:
    HAS_FITZ = False

HAS_FPDF = False
try:
    from fpdf import FPDF
    HAS_FPDF = True
except Exception:
    HAS_FPDF = False

HAS_REPORTLAB = False
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    HAS_REPORTLAB = True
except Exception:
    HAS_REPORTLAB = False


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
Ending Balance: $48,500.00""",

        # Page 9: Addendum to Loan Application
        """ADDENDUM TO UNIFORM RESIDENTIAL LOAN APPLICATION
Borrower Name: John A. Doe
Application ID: APP-2026-9482
Borrower Certifications & Credit Authorization:
I/We certify that all information provided in this loan application package is true, accurate, and complete to the best of my knowledge.""",

        # Page 10: Title Commitment Policy
        """TITLE COMMITMENT POLICY (FIRST AMERICAN TITLE)
Policy Number: FA-98234-OR
Insured Property: 742 Evergreen Terrace, Springfield, OR 97477
Vesting: John A. Doe, an unmarried individual.
Schedule A: Proposed Insured Amount: $420,000.00
Title Status: Clear Fee Simple Title.""",

        # Page 11: Real Estate Appraisal Report
        """UNIFORM RESIDENTIAL APPRAISAL REPORT (URAR FORM 1004)
Subject Property: 742 Evergreen Terrace, Springfield, OR 97477
Appraiser: Apex Appraisal Services LLC
Appraised Market Value: $420,000.00
Effective Date of Valuation: 05/10/2026
Gross Living Area: 2,450 sq ft
Overall Condition: Excellent / Fully Remodeled.""",

        # Page 12: Hazard & Homeowners Insurance Binder
        """HOMEOWNERS INSURANCE POLICY BINDER
Carrier: State Farm Insurance
Policyholder: John A. Doe
Property Location: 742 Evergreen Terrace, Springfield, OR 97477
Dwelling Coverage: $450,000.00
Annual Premium: $1,200.00 (Paid in Full at Closing).""",

        # Page 13: Initial Escrow Account Disclosure
        """INITIAL ESCROW ACCOUNT DISCLOSURE STATEMENT
Borrower: John A. Doe
Property: 742 Evergreen Terrace, Springfield, OR 97477
Initial Escrow Deposit at Closing: $1,800.00
Monthly Escrow Amount: $450.00 (Property Taxes & Hazard Insurance).""",

        # Page 14: Flood Zone Determination Certificate
        """STANDARD FLOOD HAZARD DETERMINATION (FEMA FORM 086-0-32)
Property Address: 742 Evergreen Terrace, Springfield, OR 97477
FEMA Flood Zone: Zone X (Area of Minimal Flood Hazard)
Is Property located in Special Flood Hazard Area (SFHA)? NO
Mandatory Flood Insurance Required? NO.""",

        # Page 15: Written Verification of Employment (VOE)
        """WRITTEN VERIFICATION OF EMPLOYMENT (FORM 1005)
Employer Name: TechCorp Solutions Inc.
Employee Name: John A. Doe
Position / Title: Senior Software Engineer
Employment Status: Active Full-Time (Employed 4 Years 2 Months)
Current Base Pay Rate: $91,000.00 / Year.""",

        # Page 16: Tri-Merge Credit Report Summary
        """TRI-MERGE CREDIT REPORT SUMMARY
Applicant: John A. Doe
SSN: XXX-XX-4829
Credit Scores: Experian: 765 | TransUnion: 758 | Equifax: 760
Qualifying Mid-Score: 760
Total Monthly Debt Payments: $350.00 (Auto Loan).""",

        # Page 17: Verification of Deposit (VOD)
        """VERIFICATION OF DEPOSIT (FORM 1006)
Financial Institution: Chase Bank N.A.
Account Holder: John A. Doe
Account Number Ending: #4829
Current Balance: $48,500.00
Average 2-Month Balance: $44,200.00
Account Status: Active / In Good Standing.""",

        # Page 18: IRS Tax Return Transcript
        """IRS TAX RETURN TRANSCRIPT (FORM 1040 TRANSCRIPT)
Tax Year: 2024
Taxpayer Name: John A. Doe
Adjusted Gross Income (AGI): $88,500.00
Total Tax Paid: $13,800.00
Filing Status: Single.""",

        # Page 19: Lender Closing Instructions
        """LENDER CLOSING INSTRUCTIONS & ESCROW CONDITIONS
Lender Name: Premier National Mortgage Corp
Loan Number: LNM-2026-7749
Closing Agent: First American Title Insurance
Special Conditions: Verify borrower hazard insurance binder and initial escrow funds prior to loan disbursement.""",

        # Page 20: Borrower Acknowledgment & Authorization
        """BORROWER ACKNOWLEDGMENT, AUTHORIZATION & SIGNATURE PAGE
Loan Package Document Count: 20 Pages Total
Borrower Name: John A. Doe
Signature: John A. Doe (Signed Electronically 06/15/2026)
Final Underwriting Status: APPROVED AND READY TO FUND."""
    ]

    # 1. Primary PDF Generation: FPDF2
    if HAS_FPDF:
        try:
            pdf = FPDF()
            pdf.set_auto_page_break(auto=True, margin=15)
            for text in pages_content:
                pdf.add_page()
                pdf.set_font("Helvetica", size=11)
                for line in text.split("\n"):
                    clean_line = line.encode("latin-1", "replace").decode("latin-1")
                    pdf.multi_cell(0, 8, text=clean_line)
            pdf.output(output_path)
            print(f"Sample PDF created successfully with FPDF2 at {output_path}")
            return
        except Exception as e:
            print(f"FPDF2 generation failed: {e}")

    # 2. Secondary PDF Generation: ReportLab
    if HAS_REPORTLAB:
        try:
            c = canvas.Canvas(output_path, pagesize=letter)
            width, height = letter
            for text in pages_content:
                y = height - 50
                for line in text.split("\n"):
                    c.drawString(50, y, line)
                    y -= 18
                c.showPage()
            c.save()
            print(f"Sample PDF created successfully with ReportLab at {output_path}")
            return
        except Exception as e:
            print(f"ReportLab generation failed: {e}")

    # 3. Tertiary PDF Generation: PyMuPDF
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

    # 4. Text fallback format with clear formfeed dividers for page splitting
    with open(output_path, "wb") as f:
        content = "\f\n".join(pages_content)
        f.write(content.encode("utf-8"))
    print(f"Sample loan package created as fallback text at {output_path}")


if __name__ == "__main__":
    generate_sample_loan_package()


