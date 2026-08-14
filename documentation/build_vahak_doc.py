"""
Vahak — Round 2 Technical Documentation generator.
Builds an exact 8-page A4 PDF using ReportLab, with hand-built vector diagrams
matching the Vahak design-system palette. Every Frame is filled via
Frame.addFromList so overflow is detected programmatically (leftover
flowables) rather than silently clipping or spilling onto a 9th page.
"""

import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    Frame, Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas as canvas_mod
from reportlab.pdfbase.pdfmetrics import stringWidth

# ----------------------------------------------------------------------------
# Palette (Vahak Design System)
# ----------------------------------------------------------------------------
PRIMARY = HexColor("#1E3A8A")
PRIMARY_DARK = HexColor("#152B66")
PRIMARY_TINT = HexColor("#EAF0FD")
CANVAS = HexColor("#F4F6FA")
SURFACE = HexColor("#FFFFFF")
INK900 = HexColor("#0B1220")
INK700 = HexColor("#33415C")
INK500 = HexColor("#64748B")
BORDER150 = HexColor("#E7EAF0")
BORDER300 = HexColor("#CBD5E1")
SUCCESS = HexColor("#15803D")
SUCCESS_T = HexColor("#DCFCE7")
WARNING = HexColor("#B45309")
WARNING_T = HexColor("#FEF3C7")
DANGER = HexColor("#DC2626")
DANGER_T = HexColor("#FEF2F2")
VERIFY = HexColor("#6D28D9")
VERIFY_T = HexColor("#EDE4FB")
GRAY_T = HexColor("#F1F5F9")

PAGE_W, PAGE_H = A4
MARGIN = 40
HEADER_H = 34
FOOTER_H = 26
CONTENT_X = MARGIN
CONTENT_W = PAGE_W - 2 * MARGIN
CONTENT_Y = FOOTER_H + 10
CONTENT_H = PAGE_H - HEADER_H - FOOTER_H - 26

FONT = "Helvetica"
FONT_B = "Helvetica-Bold"
FONT_I = "Helvetica-Oblique"
MONO = "Courier"
MONO_B = "Courier-Bold"

OUT_PATH = "/sessions/youthful-jolly-turing/mnt/outputs/Vahak_Round2_Technical_Documentation.pdf"

# ----------------------------------------------------------------------------
# Paragraph styles
# ----------------------------------------------------------------------------
styles = {
    "doctitle": ParagraphStyle("doctitle", fontName=FONT_B, fontSize=22, leading=25, textColor=PRIMARY, spaceAfter=2),
    "docsub": ParagraphStyle("docsub", fontName=FONT, fontSize=10.5, leading=13, textColor=INK700, spaceAfter=6),
    "meta": ParagraphStyle("meta", fontName=FONT, fontSize=8, leading=10, textColor=INK500, spaceAfter=8),
    "h1": ParagraphStyle("h1", fontName=FONT_B, fontSize=15, leading=18, textColor=PRIMARY, spaceBefore=0, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName=FONT_B, fontSize=10.5, leading=13, textColor=INK900, spaceBefore=8, spaceAfter=4),
    "h2v": ParagraphStyle("h2v", fontName=FONT_B, fontSize=10.5, leading=13, textColor=VERIFY, spaceBefore=8, spaceAfter=4),
    "body": ParagraphStyle("body", fontName=FONT, fontSize=9.4, leading=13.0, textColor=INK900, spaceAfter=5, alignment=TA_LEFT),
    "bodysm": ParagraphStyle("bodysm", fontName=FONT, fontSize=8.8, leading=12.0, textColor=INK700, spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName=FONT, fontSize=9.1, leading=12.4, textColor=INK900, leftIndent=10, spaceAfter=3.5, bulletIndent=0),
    "caption": ParagraphStyle("caption", fontName=FONT, fontSize=8.0, leading=10.2, textColor=INK500, spaceAfter=3),
    "captioni": ParagraphStyle("captioni", fontName=FONT_I, fontSize=8.0, leading=10.4, textColor=INK500, spaceAfter=3),
    "code": ParagraphStyle("code", fontName=MONO, fontSize=8.4, leading=10.6, textColor=PRIMARY_DARK),
    "cellhdr": ParagraphStyle("cellhdr", fontName=FONT_B, fontSize=8.1, leading=10.2, textColor=white),
    "cell": ParagraphStyle("cell", fontName=FONT, fontSize=8.1, leading=10.6, textColor=INK900),
    "cellmuted": ParagraphStyle("cellmuted", fontName=FONT, fontSize=7.9, leading=10.0, textColor=INK500),
    "cellmono": ParagraphStyle("cellmono", fontName=MONO, fontSize=7.7, leading=9.8, textColor=INK900),
    "notebox": ParagraphStyle("notebox", fontName=FONT, fontSize=8.2, leading=10.8, textColor=INK700),
    "notehdr": ParagraphStyle("notehdr", fontName=FONT_B, fontSize=8.6, leading=10.8, textColor=DANGER),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def bullets(items, style="bullet", bullet_char="•"):
    return ListFlowable(
        [ListItem(P(t, style), leftIndent=8) for t in items],
        bulletType="bullet", start=bullet_char, leftIndent=10, spaceBefore=1, spaceAfter=4,
        bulletFontSize=7, bulletColor=PRIMARY,
    )


def std_table(data, col_widths, header=True, font_size=7.6, row_bg=None, align_first_left=True, header_bg=PRIMARY):
    style_cmds = [
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER150),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    if header:
        style_cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ]
        for i in range(1, len(data)):
            bg = SURFACE if i % 2 == 1 else GRAY_T
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t = Table(data, colWidths=col_widths, style=TableStyle(style_cmds), repeatRows=1 if header else 0)
    return t


# ----------------------------------------------------------------------------
# Diagram primitives
# ----------------------------------------------------------------------------

def draw_box(c, x, y, w, h, fill=SURFACE, stroke=BORDER300, lw=0.9, radius=5):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(lw)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
    c.restoreState()


def centered_text(c, cx, cy, text, font=FONT_B, size=8, color=INK900):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(cx, cy - size * 0.32, text)


def wrapped_centered(c, cx, cy, text, font=FONT, size=6.6, color=INK500, max_w=90, leading=8):
    words = text.split(" ")
    lines, cur = [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    c.setFont(font, size)
    c.setFillColor(color)
    top = cy + (len(lines) - 1) * leading / 2
    for i, ln in enumerate(lines):
        c.drawCentredString(cx, top - i * leading - size * 0.32, ln)


def arrow_down(c, x, y_top, y_bot, color=INK500, lw=1.1):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x, y_top, x, y_bot + 5)
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x - 3, y_bot + 5)
    p.lineTo(x + 3, y_bot + 5)
    p.lineTo(x, y_bot)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.restoreState()


def arrow_right(c, x_left, x_right, y, color=INK500, lw=1.1):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x_left, y, x_right - 5, y)
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x_right - 5, y - 3)
    p.lineTo(x_right - 5, y + 3)
    p.lineTo(x_right, y)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.restoreState()


# ----------------------------------------------------------------------------
# Custom Flowables (diagrams)
# ----------------------------------------------------------------------------

class MiniOverview(Flowable):
    """Page 1 compact system-overview strip."""
    def __init__(self, width, height=78):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        boxes = [
            ("Clients", "Sender / Conductor /\nRecipient / Admin", PRIMARY_TINT, PRIMARY),
            ("Mobile + Dashboard", "Expo React Native app\nNext.js admin console", SURFACE, BORDER300),
            ("NestJS API", "Auth · Consignments ·\nRoutes / Halts / Buses", SURFACE, BORDER300),
            ("PostgreSQL", "Prisma ORM\nrelational storage", SURFACE, BORDER300),
        ]
        n = len(boxes)
        gap = 14
        bw = (w - gap * (n - 1)) / n
        bh = h - 4
        y = 4
        for i, (title, sub, fill, stroke) in enumerate(boxes):
            x = i * (bw + gap)
            draw_box(c, x, y, bw, bh, fill=fill, stroke=stroke, radius=6)
            centered_text(c, x + bw / 2, y + bh - 14, title, font=FONT_B, size=7.6, color=PRIMARY if i == 0 else INK900)
            for j, line in enumerate(sub.split("\n")):
                c.setFont(FONT, 6.4)
                c.setFillColor(INK500)
                c.drawCentredString(x + bw / 2, y + bh - 28 - j * 8.5, line)
            if i < n - 1:
                arrow_right(c, x + bw, x + bw + gap, y + bh / 2)


class ArchDiagram(Flowable):
    def __init__(self, width, height=300):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        layer_h = 60
        gap = 30
        top = h

        def layer_label(y_top, label):
            c.setFont(FONT_B, 7.4)
            c.setFillColor(INK500)
            c.drawString(0, y_top - 9, label)

        # Layer 1: clients
        y1 = top - 9
        layer_label(y1, "CLIENT LAYER")
        y1_box = y1 - layer_h
        cw = (w - 3 * 10) / 4
        client_labels = ["Sender", "Conductor", "Recipient", "Admin"]
        for i, lab in enumerate(client_labels):
            x = i * (cw + 10)
            draw_box(c, x, y1_box, cw, layer_h - 10, fill=PRIMARY_TINT, stroke=PRIMARY, radius=6)
            centered_text(c, x + cw / 2, y1_box + (layer_h - 10) / 2, lab, font=FONT_B, size=8, color=PRIMARY)

        # Layer 2: application (positions needed before drawing arrows)
        y2_top = y1_box - gap
        y2_box = y2_top - layer_h
        half = (w - 12) / 2
        mobile_cx = half / 2
        dash_cx = half + 12 + half / 2

        # arrows: Sender/Conductor/Recipient -> Mobile App; Admin -> both Mobile App and Dashboard
        arrow_start_y = y1_box - 4
        arrow_end_y = y2_top
        for i in range(3):  # Sender, Conductor, Recipient
            x0 = i * (cw + 10) + cw / 2
            c.saveState()
            c.setStrokeColor(BORDER300)
            c.setLineWidth(1.0)
            c.line(x0, arrow_start_y, x0, arrow_start_y - 6)
            c.line(x0, arrow_start_y - 6, mobile_cx, arrow_end_y + 8)
            c.restoreState()
        arrow_down(c, mobile_cx, arrow_end_y + 8, arrow_end_y, color=INK500)
        # Admin -> Dashboard (primary) and a thin branch -> Mobile App (secondary, admin has a lightweight mobile view too)
        admin_x = 3 * (cw + 10) + cw / 2
        arrow_down(c, admin_x, arrow_start_y, arrow_end_y, color=INK500)
        c.saveState()
        c.setStrokeColor(BORDER300)
        c.setLineWidth(0.7)
        c.setDash(2, 2)
        c.line(admin_x, arrow_start_y - 6, mobile_cx + 14, arrow_end_y + 6)
        c.setDash()
        c.restoreState()

        # Layer 2: application boxes
        layer_label(y2_top + 9, "APPLICATION LAYER")
        draw_box(c, 0, y2_box, half, layer_h - 10, fill=SURFACE, stroke=BORDER300, radius=6)
        centered_text(c, half / 2, y2_box + (layer_h - 10) / 2 + 9, "Mobile App", font=FONT_B, size=8.4, color=INK900)
        wrapped_centered(c, half / 2, y2_box + (layer_h - 10) / 2 - 6, "Expo / React Native · Sender, Conductor, Recipient + lightweight Admin", size=6.4, max_w=half - 14)
        draw_box(c, half + 12, y2_box, half, layer_h - 10, fill=SURFACE, stroke=BORDER300, radius=6)
        centered_text(c, dash_cx, y2_box + (layer_h - 10) / 2 + 9, "Admin Dashboard", font=FONT_B, size=8.4, color=INK900)
        wrapped_centered(c, dash_cx, y2_box + (layer_h - 10) / 2 - 6, "Next.js 16 · Tailwind CSS 4 · web only, full network management", size=6.4, max_w=half - 14)

        y3_top = y2_box - gap
        arrow_down(c, mobile_cx, y2_box, y3_top)
        arrow_down(c, dash_cx, y2_box, y3_top)

        # Layer 3: API
        y3 = y3_top
        layer_label(y3 + 9, "API LAYER  —  NestJS, single deployable service (modular monolith)")
        api_h = layer_h + 18
        y3_box = y3 - api_h
        draw_box(c, 0, y3_box, w, api_h - 10, fill=SURFACE, stroke=PRIMARY, radius=6)
        modules = ["Auth\n(JWT + bcrypt)", "Consignments\n(book/accept/handover/verify/cancel)", "Routes · Halts · Buses\n(network admin)", "Guards\n(JwtAuthGuard + RolesGuard)"]
        mw = (w - 5 * 8) / 4
        for i, m in enumerate(modules):
            x = 8 + i * (mw + 8)
            draw_box(c, x, y3_box + 6, mw, api_h - 22, fill=PRIMARY_TINT, stroke=PRIMARY, radius=5)
            lines = m.split("\n")
            centered_text(c, x + mw / 2, y3_box + api_h / 2 + 2, lines[0], font=FONT_B, size=7, color=PRIMARY)
            wrapped_centered(c, x + mw / 2, y3_box + api_h / 2 - 10, lines[1], size=6, max_w=mw - 8)

        y4_top = y3_box - gap
        arrow_down(c, w / 2, y3_box, y4_top)

        # Layer 4: data
        y4 = y4_top
        layer_label(y4 + 9, "DATA LAYER")
        y4_box = y4 - layer_h
        dw = (w - 10) / 2
        draw_box(c, 0, y4_box, dw, layer_h - 10, fill=SURFACE, stroke=BORDER300, radius=6)
        centered_text(c, dw / 2, y4_box + (layer_h - 10) / 2 + 8, "PostgreSQL", font=FONT_B, size=8, color=INK900)
        wrapped_centered(c, dw / 2, y4_box + (layer_h - 10) / 2 - 5, "relational store, single instance", size=6.3, max_w=dw - 14)
        draw_box(c, dw + 10, y4_box, dw, layer_h - 10, fill=SURFACE, stroke=BORDER300, radius=6)
        centered_text(c, dw + 10 + dw / 2, y4_box + (layer_h - 10) / 2 + 8, "Prisma ORM", font=FONT_B, size=8, color=INK900)
        wrapped_centered(c, dw + 10 + dw / 2, y4_box + (layer_h - 10) / 2 - 5, "typed schema + migrations", size=6.3, max_w=dw - 14)


class ERDiagram(Flowable):
    def __init__(self, width, height=250):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        bw, bh = 92, 34
        # coordinates (x,y = bottom-left) hand-placed on a 3-row grid
        pos = {
            "User": (10, h - bh),
            "Route": (w / 2 - bw / 2, h - bh),
            "IncentiveLedger": (w - bw - 10, h - bh),
            "Halt": (w / 2 - bw - 20, h / 2 - bh / 2 + 6),
            "Bus": (w / 2 + 20, h / 2 - bh / 2 + 6),
            "Consignment": (w / 2 - bw / 2, 44),
            "ConsignmentEvent": (10, 4),
            "DeliveryProof": (w - bw - 10, 4),
        }
        note = {"IncentiveLedger": "schema defined — no service/controller yet"}
        for name, (x, y) in pos.items():
            fill = WARNING_T if name in note else SURFACE
            stroke = WARNING if name in note else PRIMARY
            draw_box(c, x, y, bw, bh, fill=fill, stroke=stroke, radius=5)
            centered_text(c, x + bw / 2, y + bh - 13, name, font=FONT_B, size=7, color=INK900)
            if name in note:
                wrapped_centered(c, x + bw / 2, y + 9, note[name], size=5.4, color=WARNING, max_w=bw - 8, leading=6.5)

        def edge(a, b, label, dx1=0.5, dx2=0.5, dy1=0, dy2=1):
            ax, ay = pos[a]
            bx, by = pos[b]
            x1, y1 = ax + bw * dx1, ay + bh * dy1
            x2, y2 = bx + bw * dx2, by + bh * dy2
            c.setStrokeColor(BORDER300)
            c.setLineWidth(0.8)
            c.line(x1, y1, x2, y2)
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            c.setFillColor(SURFACE)
            c.setFont(FONT, 5.6)
            tw = stringWidth(label, FONT, 5.6)
            c.rect(mx - tw / 2 - 2, my - 3.5, tw + 4, 7, fill=1, stroke=0)
            c.setFillColor(INK500)
            c.drawCentredString(mx, my - 2, label)

        edge("Route", "Halt", "1 : N", dx1=0.3, dy1=0, dx2=0.7, dy2=1)
        edge("Route", "Bus", "1 : N", dx1=0.7, dy1=0, dx2=0.3, dy2=1)
        edge("Route", "Consignment", "1 : N", dx1=0.5, dy1=0, dx2=0.5, dy2=1)
        edge("Halt", "Consignment", "pickup / dropoff", dx1=0.5, dy1=0, dx2=0.15, dy2=1)
        edge("Bus", "Consignment", "0/1 : N", dx1=0.5, dy1=0, dx2=0.85, dy2=1)
        edge("User", "Consignment", "sender / conductor / recipient", dx1=0.5, dy1=0, dx2=0.05, dy2=1)
        edge("Consignment", "ConsignmentEvent", "1 : N", dx1=0.3, dy1=0, dx2=0.5, dy2=1)
        edge("Consignment", "DeliveryProof", "1 : 1", dx1=0.7, dy1=0, dx2=0.5, dy2=1)
        edge("User", "IncentiveLedger", "1 : N", dx1=0.9, dy1=1, dx2=0.5, dy2=0)
        edge("Consignment", "IncentiveLedger", "0/1 : N (unused)", dx1=0.9, dy1=1, dx2=0.5, dy2=0)


class StateMachine(Flowable):
    def __init__(self, width, height=90):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        states = [
            ("CREATED", INK500, GRAY_T),
            ("BOOKED", WARNING, WARNING_T),
            ("ACCEPTED", PRIMARY, PRIMARY_TINT),
            ("IN_TRANSIT", VERIFY, VERIFY_T),
            ("DELIVERED", SUCCESS, SUCCESS_T),
        ]
        n = len(states)
        bw, bh = 80, 30
        gap = (w - n * bw) / (n - 1)
        y = h - bh - 6
        xs = []
        for i, (label, stroke, fill) in enumerate(states):
            x = i * (bw + gap)
            xs.append(x)
            draw_box(c, x, y, bw, bh, fill=fill, stroke=stroke, radius=14)
            centered_text(c, x + bw / 2, y + bh / 2, label, font=FONT_B, size=7, color=stroke)
            if i < n - 1:
                arrow_right(c, x + bw, x + bw + gap, y + bh / 2, color=BORDER300)
        # cancelled branch
        cy = y - 34
        cx = w / 2 - 40
        draw_box(c, cx, cy, 80, 24, fill=DANGER_T, stroke=DANGER, radius=12)
        centered_text(c, cx + 40, cy + 12, "CANCELLED", font=FONT_B, size=7, color=DANGER)
        c.setStrokeColor(DANGER)
        c.setDash(2, 2)
        c.setLineWidth(0.9)
        for i in range(4):
            x = xs[i] + bw / 2
            c.line(x, y, x, cy + 24 + 4)
        c.setDash()
        c.setFont(FONT_I, 6)
        c.setFillColor(DANGER)
        c.drawCentredString(w / 2, cy - 9, "CREATED / BOOKED / ACCEPTED / IN_TRANSIT may all cancel — terminal branch, not a workflow step")


class WorkflowDiagram(Flowable):
    def __init__(self, width, height=330):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        main_w = w * 0.66
        side_x = main_w + 18
        side_w = w - side_x

        steps = [
            ("SENDER", None, PRIMARY),
            ("Select route → pickup/dropoff halts", None, None),
            ("Enter recipient ID · parcel size · description", None, None),
            ("Create + book consignment → tracking code issued", "BOOKED", WARNING),
            ("CONDUCTOR", None, PRIMARY),
            ("Accept consignment", "ACCEPTED", PRIMARY),
            ("Initiate handover → 6-digit PIN generated (30 min expiry)", "IN_TRANSIT", VERIFY),
            ("RECIPIENT", None, PRIMARY),
            ("Enter PIN → verified against stored hash", "DELIVERED", SUCCESS),
        ]
        n = len(steps)
        gap = 6
        row_h = (h - gap * (n - 1)) / n
        y = h - row_h
        for i, (label, badge, color) in enumerate(steps):
            is_actor = label.isupper() and badge is None
            if is_actor:
                c.setFont(FONT_B, 8.2)
                c.setFillColor(PRIMARY)
                c.drawString(0, y + row_h / 2 - 3, label)
            else:
                bw = main_w - 14
                fill = SUCCESS_T if color == SUCCESS else (VERIFY_T if color == VERIFY else (WARNING_T if color == WARNING else (PRIMARY_TINT if color == PRIMARY else SURFACE)))
                stroke = color if color else BORDER300
                draw_box(c, 14, y, bw, row_h - 6, fill=fill if badge else SURFACE, stroke=stroke, radius=5)
                c.setFont(FONT, 6.9)
                c.setFillColor(INK900)
                c.drawString(22, y + row_h / 2 - 5, label[:78])
                if badge:
                    bwid = stringWidth(badge, FONT_B, 6.4) + 10
                    bx = 14 + bw - bwid - 6
                    draw_box(c, bx, y + 3, bwid, row_h - 12, fill=SURFACE, stroke=color, radius=7)
                    centered_text(c, bx + bwid / 2, y + row_h / 2 - 2, badge, font=FONT_B, size=6.2, color=color)
            if i < n - 1:
                nxt_is_actor = steps[i + 1][0].isupper() and steps[i + 1][1] is None
                if not is_actor:
                    arrow_down(c, 14 + 10, y, y - gap, color=BORDER300, lw=0.9)
            y -= row_h + gap

        # side panel: admin
        draw_box(c, side_x, h - 150, side_w, 150, fill=SURFACE, stroke=PRIMARY, radius=6)
        c.setFont(FONT_B, 8)
        c.setFillColor(PRIMARY)
        c.drawCentredString(side_x + side_w / 2, h - 20, "ADMIN")
        c.setFont(FONT, 6.4)
        c.setFillColor(INK500)
        c.drawCentredString(side_x + side_w / 2, h - 31, "network management")
        admin_steps = ["Manage Routes", "Manage Halts", "Manage Buses", "Find consignment\nby tracking ID\n(read-only)"]
        ay = h - 46
        for step in admin_steps:
            sh = 26 if "\n" not in step else 34
            draw_box(c, side_x + 8, ay - sh, side_w - 16, sh, fill=PRIMARY_TINT, stroke=PRIMARY, radius=4)
            lines = step.split("\n")
            for j, ln in enumerate(lines):
                c.setFont(FONT, 6.2)
                c.setFillColor(PRIMARY)
                c.drawCentredString(side_x + side_w / 2, ay - 11 - j * 8, ln)
            if step != admin_steps[-1]:
                arrow_down(c, side_x + side_w / 2, ay - sh, ay - sh - 8, color=PRIMARY)
            ay -= sh + 8


# ----------------------------------------------------------------------------
# Header / footer chrome
# ----------------------------------------------------------------------------

def draw_chrome(c, page_title, page_no, total=8):
    # background canvas
    c.setFillColor(CANVAS)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # header
    c.setFillColor(PRIMARY)
    c.rect(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, fill=1, stroke=0)
    c.setFont(FONT_B, 10)
    c.setFillColor(white)
    c.drawString(MARGIN, PAGE_H - HEADER_H + 11, "VAHAK")
    c.setFont(FONT, 7.6)
    c.setFillColor(HexColor("#C7D2E8"))
    c.drawString(MARGIN + 40, PAGE_H - HEADER_H + 12.5, "Technical Documentation · Round 2")
    c.setFont(FONT_B, 8.6)
    c.setFillColor(white)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - HEADER_H + 11.5, page_title)
    # footer
    c.setStrokeColor(BORDER300)
    c.setLineWidth(0.6)
    c.line(MARGIN, FOOTER_H + 4, PAGE_W - MARGIN, FOOTER_H + 4)
    c.setFont(FONT, 7)
    c.setFillColor(INK500)
    c.drawString(MARGIN, FOOTER_H - 8, "Smart Kopargaon Hackathon · PS014 · Vahak")
    c.drawRightString(PAGE_W - MARGIN, FOOTER_H - 8, "Page %d of %d" % (page_no, total))


def render_page(c, page_title, page_no, story, frame_h=None):
    draw_chrome(c, page_title, page_no)
    fh = frame_h if frame_h else CONTENT_H
    frame = Frame(CONTENT_X, CONTENT_Y, CONTENT_W, fh, leftPadding=0, rightPadding=0,
                   topPadding=0, bottomPadding=0, showBoundary=0)
    leftover = frame.addFromList(story, c)
    c.showPage()
    if leftover:
        print("!! OVERFLOW on page %s: %d flowables did not fit" % (page_title, len(leftover)), file=sys.stderr)
    return leftover


# ----------------------------------------------------------------------------
# Page content builders
# ----------------------------------------------------------------------------

def page1():
    s = []
    s.append(P("VAHAK", "doctitle"))
    s.append(P("Offline-First Public Bus Parcel Delivery Network — Technical Documentation", "docsub"))
    s.append(P("Smart Kopargaon Hackathon 2026 · Problem Statement PS014 · Round 2 Submission", "meta"))

    s.append(P("1. Problem Statement", "h2"))
    s.append(P(
        "Parcel movement in rural and semi-urban areas is often slow, expensive, or unavailable outside "
        "major courier networks. Public buses already travel fixed routes on fixed schedules through these "
        "same areas, with spare load capacity going unused on most trips.", "body"))

    s.append(P("2. Proposed Solution", "h2"))
    s.append(P(
        "Vahak coordinates parcel booking, bus-route assignment, conductor acceptance, and recipient "
        "verification through a role-based consignment workflow layered on top of an existing public bus "
        "network. The system does not operate vehicles; it models routes, halts and buses as data and "
        "assigns parcels to that existing capacity.", "body"))

    s.append(P("3. Motivation", "h2"))
    s.append(P(
        "Three gaps motivate the design: (a) existing transport capacity goes unused for logistics, "
        "(b) an unattended handover between strangers (conductor → recipient) needs a trust mechanism, "
        "and (c) four distinct actors (sender, conductor, recipient, admin) need clearly separated "
        "permissions rather than one generic user type.", "body"))

    s.append(P("4. Objectives", "h2"))
    s.append(bullets([
        "Model routes, halts and buses as first-class, queryable network entities.",
        "Let senders book against real route and halt data, not free-text addresses.",
        "Give conductors an explicit accept → handover flow tied to consignment state.",
        "Verify delivery through a single-use, time-limited PIN rather than an honor system.",
        "Give administrators direct visibility into and control over network infrastructure.",
    ]))

    s.append(P("5. Key Features (implemented)", "h2"))
    s.append(bullets([
        "Role-based authentication for four roles (JWT + bcrypt password hashing).",
        "Route / halt / bus network model with per-record data-source provenance "
        "(REAL, PUBLIC_THIRD_PARTY, COMMUNITY_DERIVED, DERIVED, SIMULATED) populated via an OSM ingestion pipeline.",
        "Explicit six-state consignment lifecycle with a server-written event log per transition.",
        "PIN-based delivery proof: SHA-256 hashed code, unique nonce, 30-minute expiry, attempt limiting.",
        "Admin web dashboard for route/halt/bus management and consignment lookup by tracking ID.",
    ]))

    s.append(P("6. Technical Overview", "h2"))
    s.append(P(
        "Vahak is a single monorepo: <font face='Courier'>apps/mobile</font> (Expo / React Native, "
        "role-based navigation), <font face='Courier'>apps/dashboard</font> (Next.js admin console), "
        "<font face='Courier'>services/api</font> (NestJS REST API), and "
        "<font face='Courier'>database/</font> (Prisma schema, migrations, seed and OSM-ingestion scripts). "
        "The current prototype is a connected, request/response system: the mobile client calls the API "
        "directly over REST for every read and write. Offline-first local persistence is a stated design "
        "direction for the product but is not implemented in this build — see Page 8.", "body"))

    s.append(Spacer(1, 4))
    s.append(P("System overview", "caption"))
    s.append(MiniOverview(CONTENT_W, 96))
    return s


def page2():
    s = []
    s.append(P("System Architecture", "h1"))
    s.append(ArchDiagram(CONTENT_W, 372))
    s.append(Spacer(1, 6))

    data = [
        [P("Layer", "cellhdr"), P("Technology", "cellhdr"), P("Purpose", "cellhdr")],
        [P("Mobile app", "cell"), P("Expo / React Native 0.86, React Navigation 7 (native-stack)", "cell"), P("Role-based mobile client for Sender / Conductor / Recipient / Admin", "cell")],
        [P("Admin dashboard", "cell"), P("Next.js 16, Tailwind CSS 4", "cell"), P("Web console for network management and consignment lookup", "cell")],
        [P("Backend API", "cell"), P("NestJS 11, TypeScript", "cell"), P("Single modular REST service (auth, consignments, routes/halts/buses)", "cell")],
        [P("ORM", "cell"), P("Prisma 7 (+ @prisma/adapter-pg)", "cell"), P("Typed schema, migrations, query builder over PostgreSQL", "cell")],
        [P("Database", "cell"), P("PostgreSQL", "cell"), P("Relational storage; single instance", "cell")],
        [P("Auth", "cell"), P("@nestjs/jwt + passport-jwt, bcrypt", "cell"), P("Stateless bearer-token auth; salted password hashing", "cell")],
    ]
    s.append(std_table(data, [90, 220, CONTENT_W - 310]))
    s.append(Spacer(1, 6))
    s.append(P(
        "The backend is a single modular NestJS application — a modular monolith, not a microservice "
        "deployment. Feature modules (auth, consignments, routes/halts/buses) are separated by responsibility "
        "but share one process, one database connection pool, and one deploy artifact, which matches the "
        "current single-team, single-environment scope of the prototype. Role separation is enforced at the "
        "API boundary (<font face='Courier'>JwtAuthGuard</font> + <font face='Courier'>RolesGuard</font> "
        "with an explicit <font face='Courier'>@Roles()</font> decorator per endpoint), not by separate "
        "deployments per role.", "body"))
    s.append(P(
        "<b>Offline operation:</b> not implemented in the current build. The mobile client is a standard "
        "connected REST client (axios); every screen requires network connectivity to the API. No local "
        "database, request queue, or sync layer exists in <font face='Courier'>apps/mobile</font> today.", "bodysm"))
    return s


def page3():
    s = []
    s.append(P("System Design & Data Model", "h1"))
    s.append(P("Entity-relationship model (from database/prisma/schema.prisma)", "caption"))
    s.append(ERDiagram(CONTENT_W, 234))
    s.append(Spacer(1, 4))

    role_data = [
        [P("Role", "cellhdr"), P("Implemented capability", "cellhdr")],
        [P("Sender", "cell"), P("Books a consignment against a route + pickup/dropoff halt pair; views and cancels own consignments (while in a cancellable status).", "cell")],
        [P("Conductor", "cell"), P("Views consignments booked-but-unclaimed and those assigned to them; accepts a consignment; initiates handover (generates the PIN).", "cell")],
        [P("Recipient", "cell"), P("Views incoming deliveries addressed to them; verifies handover by submitting the PIN.", "cell")],
        [P("Admin", "cell"), P("Full CRUD on routes, halts and buses; read-only consignment lookup by tracking ID (no bulk listing endpoint exists).", "cell")],
    ]
    s.append(std_table(role_data, [58, CONTENT_W - 58], font_size=7.4))
    s.append(Spacer(1, 6))

    s.append(P("Consignment state machine", "h2"))
    s.append(StateMachine(CONTENT_W, 112))
    s.append(P(
        "<font face='Courier'>HANDOVER_INITIATED</font> and <font face='Courier'>HANDOVER_VERIFIED</font> "
        "are recorded as <font face='Courier'>ConsignmentEvent</font> entries inside the "
        "<font face='Courier'>IN_TRANSIT</font> status — the Prisma schema defines only six values for "
        "<font face='Courier'>ConsignmentStatus</font> itself.", "bodysm"))
    return s


def page4():
    s = []
    s.append(P("End-to-End Operational Workflow", "h1"))
    s.append(WorkflowDiagram(CONTENT_W, 336))
    s.append(Spacer(1, 4))
    s.append(P("Methodology", "h2"))
    s.append(bullets([
        "<b>Role-based access</b> — every mutating endpoint is guarded by JWT authentication plus a "
        "<font face='Courier'>@Roles()</font> check (e.g. only <font face='Courier'>CONDUCTOR</font> can call accept/handover).",
        "<b>Explicit state transitions</b> — each transition is its own endpoint with a server-side precondition "
        "(e.g. handover can only be initiated from <font face='Courier'>ACCEPTED</font>; verification only from "
        "<font face='Courier'>IN_TRANSIT</font>), rejected with a typed exception otherwise.",
        "<b>Route/halt-based logistics</b> — pickup and dropoff halts are validated server-side to belong to the "
        "selected route before a consignment is created.",
        "<b>Secure delivery verification</b> — the handover PIN is never stored in plain text: the API persists "
        "<font face='Courier'>SHA-256(pin:nonce)</font>, a unique nonce, a 30-minute expiry, and an attempt counter "
        "(capped at 5).",
        "<b>Offline-first synchronization</b> — not implemented in the current build; every step above requires "
        "live connectivity to the API.",
        "<b>Validation and error handling</b> — request bodies are validated with class-validator DTOs; domain "
        "failures map to typed HTTP exceptions (404 not found, 403 forbidden, 400 bad request, 409 conflict) "
        "through a shared exception filter.",
    ]))
    s.append(Spacer(1, 2))
    note = Table(
        [[P("IN_TRANSIT — semantic clarification", "notehdr")],
         [P(
             "IN_TRANSIT is set when the conductor initiates handover (the PIN is generated), which happens near "
             "arrival at the dropoff halt — not when the bus departs with the parcel aboard. The schema has no "
             "location or telemetry field on Bus/Route; the status does not represent, and this document does not "
             "claim, live GPS movement or an ETA.", "notebox")]],
        colWidths=[CONTENT_W], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), VERIFY_T),
            ("BOX", (0, 0), (-1, -1), 0.8, VERIFY),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
    s.append(note)
    return s


def page5():
    s = []
    s.append(P("Implementation", "h1"))
    s.append(P("Mobile application — implemented screens", "h2"))
    mob = [
        [P("Area", "cellhdr"), P("Screens", "cellhdr")],
        [P("Auth", "cell"), P("Login, Register (role selector: Sender / Conductor / Recipient)", "cell")],
        [P("Sender", "cell"), P("Home, Available Routes, Select Halts, Book Parcel, Booking Confirmation, My Consignments, Consignment Detail", "cell")],
        [P("Conductor", "cell"), P("Home, Available Consignments (sectioned queue), Find Consignment (by ID), Consignment Detail", "cell")],
        [P("Recipient", "cell"), P("Home, Incoming Deliveries, Find Delivery (by ID), Consignment Detail, PIN Verification, Delivery Confirmation", "cell")],
        [P("Admin", "cell"), P("Home, Route List/Form/Detail, Halt Form, Bus Form, Find Consignment (by ID), Consignment Detail (read-only)", "cell")],
    ]
    s.append(std_table(mob, [55, CONTENT_W - 55], font_size=7.3))

    s.append(P("Backend — modules", "h2"))
    be = [
        [P("Module", "cellhdr"), P("Responsibility", "cellhdr")],
        [P("Auth", "cell"), P("Register, login, current-user lookup; bcrypt hashing; JWT issuance (1h expiry)", "cell")],
        [P("Consignments", "cell"), P("create, book, accept, initiate-handover, verify-handover, cancel, per-role list/detail", "cell")],
        [P("Routes / Halts / Buses", "cell"), P("Admin CRUD; sender-facing read-only route/halt discovery endpoints", "cell")],
        [P("Shared", "cell"), P("PrismaService, global exception filter, request/response provenance stripping", "cell")],
    ]
    s.append(std_table(be, [95, CONTENT_W - 95], font_size=7.3))

    s.append(P("Database", "h2"))
    s.append(P(
        "PostgreSQL accessed through Prisma 7. Six migrations track schema evolution from initial models "
        "through timestamptz conversion, password support, delivery-proof attempt tracking, and route/halt/bus "
        "provenance metadata. Cascading deletes remove dependent <font face='Courier'>ConsignmentEvent</font> and "
        "<font face='Courier'>DeliveryProof</font> rows with their parent consignment, and dependent "
        "<font face='Courier'>Halt</font> rows with their parent route. Indexes exist on "
        "<font face='Courier'>Consignment</font> (senderId, recipientId, conductorId, routeId, status) and "
        "<font face='Courier'>ConsignmentEvent</font> (consignmentId, createdAt). Unique constraints cover "
        "tracking code, user phone/email, and provider+externalId pairs on ingested route/halt/bus records.", "body"))

    s.append(P("Security — implemented mechanisms only", "h2"))
    s.append(bullets([
        "Passwords hashed with bcrypt (cost factor 12); raw passwords are never persisted.",
        "JWT bearer authentication (<font face='Courier'>@nestjs/jwt</font>), 1-hour expiry, payload limited to user id / phone / role.",
        "Per-endpoint role authorization via <font face='Courier'>JwtAuthGuard</font> + <font face='Courier'>RolesGuard</font>.",
        "Self-registration is restricted server-side to SENDER / CONDUCTOR / RECIPIENT "
        "(<font face='Courier'>RegisterDto</font> validator) — ADMIN accounts cannot be created through the public endpoint.",
        "Handover PIN stored only as <font face='Courier'>SHA-256(pin:nonce)</font>, with a unique nonce, 30-minute expiry, "
        "and a server-enforced 5-attempt cap; ownership is checked (only the assigned conductor can initiate handover, "
        "only the addressed recipient can verify it).",
    ]))
    s.append(P(
        "Not implemented: refresh tokens, request rate limiting, PIN regeneration/resend, and encryption beyond what "
        "the hosting/database layer provides by default (not independently verified in this review).", "bodysm"))
    return s


def page6():
    s = []
    s.append(P("Testing & Validation", "h1"))
    s.append(P("Automated tests present in repository", "h2"))
    s.append(P(
        "Jest specs exist for the modules below (static inspection of committed test files). Execution was not "
        "re-run as part of this documentation pass — this environment has no provisioned PostgreSQL instance "
        "or <font face='Courier'>.env</font> configured, so results are reported as “present in repository,” "
        "not as a fresh pass/fail run.", "bodysm"))
    tst = [
        [P("Test file", "cellhdr"), P("Module under test", "cellhdr"), P("Test cases (it-blocks)", "cellhdr")],
        [P("auth.service.spec.ts / auth.controller.spec.ts", "cellmono"), P("Registration, login", "cell"), P("2", "cell")],
        [P("consignments.service.spec.ts", "cellmono"), P("Full consignment lifecycle logic", "cell"), P("39", "cell")],
        [P("routes.service.spec.ts, buses.service.spec.ts, halts.service.spec.ts", "cellmono"), P("Route/halt/bus CRUD", "cell"), P("6", "cell")],
        [P("sender-routes.service.spec.ts", "cellmono"), P("Sender-facing route/halt discovery", "cell"), P("7", "cell")],
        [P("provenance.spec.ts", "cellmono"), P("Data-source provenance stripping", "cell"), P("3", "cell")],
        [P("normalize.spec.ts, osm-write.spec.ts", "cellmono"), P("OSM ingestion pipeline", "cell"), P("34", "cell")],
    ]
    s.append(std_table(tst, [175, 165, CONTENT_W - 340], font_size=7.2))

    s.append(P("Validation matrix", "h2"))
    s.append(P("Method key: “Source inspection” = behavior confirmed by reading the guard/service/DTO logic in the repository, not by executing the app.", "captioni"))
    rows = [
        ("Duplicate phone/email on registration is rejected", "Source inspection", "ConflictException in AuthService.register"),
        ("Self-registration cannot create an ADMIN account", "Source inspection", "RegisterDto @IsIn(['SENDER','CONDUCTOR','RECIPIENT'])"),
        ("Invalid login credentials are rejected", "Source inspection", "UnauthorizedException on bcrypt.compare failure"),
        ("Non-conductor cannot accept a consignment", "Source inspection", "@Roles('CONDUCTOR') on POST /consignments/:id/accept"),
        ("Pickup/dropoff halts must belong to selected route", "Source inspection", "BadRequestException in ConsignmentsService.create"),
        ("Client-supplied fare is ignored", "Source inspection", "resolveDemoFare() always used, DTO fare field discarded"),
        ("Handover cannot start outside ACCEPTED", "Source inspection", "BadRequestException in initiateHandover"),
        ("Verification cannot succeed outside IN_TRANSIT", "Source inspection", "BadRequestException in verifyHandover"),
        ("Only the assigned recipient can verify a PIN", "Source inspection", "ForbiddenException on recipientId mismatch"),
        ("Expired PIN is rejected", "Source inspection", "expiresAt compared to current time before hash check"),
        ("PIN attempts are capped and counted", "Source inspection", "MAX_ATTEMPTS = 5; attempts incremented on mismatch"),
        ("Admin cannot mutate consignments", "Source inspection", "No @Roles('ADMIN') on any consignment write endpoint"),
        ("Core consignment lifecycle logic", "Automated (repo)", "consignments.service.spec.ts — 39 cases, not re-executed"),
    ]
    data = [[P("Feature", "cellhdr"), P("Verification method", "cellhdr"), P("Basis", "cellhdr")]]
    for f, m, b in rows:
        data.append([P(f, "cell"), P(m, "cellmuted"), P(b, "cellmono")])
    s.append(std_table(data, [175, 78, CONTENT_W - 253], font_size=7.0))
    s.append(Spacer(1, 3))
    s.append(P(
        "No end-to-end manual run of the mobile app or dashboard against a live database was performed in this "
        "documentation session. Performance benchmarking was not conducted as part of the current prototype.", "captioni"))
    return s


def page7():
    s = []
    s.append(P("Results & Prototype Demonstration", "h1"))
    s.append(P(
        "No screenshots are included in this document. The prototype requires a provisioned PostgreSQL instance, "
        "applied migrations and seed data to render any authenticated screen; reliably standing that up plus a "
        "mobile (Expo) and web (Next.js) runtime inside this documentation session was not attempted rather than "
        "risk fabricated or misleading captures. The screen inventory on Page 5 and the flow/diagram on Page 4 "
        "describe the same surfaces a screenshot set would otherwise show.", "body"))

    s.append(P("Implemented outcomes (verified against repository)", "h2"))
    s.append(bullets([
        "Four-role authentication and authorization (Sender, Conductor, Recipient, Admin) enforced server-side.",
        "Route → halt → bus network model, populated through both manual admin entry and an OSM ingestion script.",
        "Full sender booking flow: route browse → halt selection → parcel details → tracking-code issuance.",
        "Conductor accept → handover flow with server-generated, hashed, expiring PIN.",
        "Recipient PIN verification with attempt limiting, transitioning the consignment to DELIVERED.",
        "Admin network management (routes/halts/buses) and single-consignment lookup by tracking ID.",
    ]))

    s.append(P("Current limitations (verified)", "h2"))
    s.append(bullets([
        "No live GPS position or ETA — no location field exists on Bus/Route.",
        "No exposed event-timeline endpoint — ConsignmentEvent rows are written on every transition but never returned by any API response.",
        "No PIN regeneration/resend endpoint — a lost or expired PIN has no in-app recovery path.",
        "No admin-wide consignment list or aggregate dashboard endpoint — admin lookup is single-record, by ID only.",
        "No recipient search — senders enter a recipient's raw account ID; no name/phone lookup endpoint exists.",
        "No offline-first storage or sync layer in the mobile client, despite that being the product's stated direction.",
        "IncentiveLedger exists in the schema with no reading/writing backend module — modeled, not wired up.",
    ]))

    s.append(Spacer(1, 4))
    demo = Table(
        [[P("Demo flow", "notehdr")],
         [P("Login  →  Book (route/halt/parcel)  →  Accept (conductor)  →  Initiate handover (PIN issued)  "
            "→  Verify (recipient enters PIN)  →  DELIVERED", "notebox")]],
        colWidths=[CONTENT_W], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PRIMARY_TINT),
            ("BOX", (0, 0), (-1, -1), 0.8, PRIMARY),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
    s.append(demo)
    return s


def page8():
    s = []
    s.append(P("Future Scope & References", "h1"))
    s.append(P("Future scope (not implemented — proposed direction only)", "h2"))
    s.append(bullets([
        "Live bus position and ETA prediction, once a location/telemetry source is available.",
        "A queryable event-timeline API surfacing the already-recorded ConsignmentEvent history.",
        "Notification infrastructure (SMS/push) for status changes and PIN issuance.",
        "Recipient lookup by phone/name to replace raw-ID entry during booking.",
        "PIN regeneration/recovery for lost or expired handover codes.",
        "Admin-wide consignment search, filtering, and aggregate operational dashboards.",
        "Offline-first mobile storage and sync (the architecture direction named in the project README).",
        "Route optimization and production-scale deployment hardening.",
    ]))

    s.append(P("Technical references", "h2"))
    s.append(bullets([
        "NestJS — https://docs.nestjs.com",
        "Prisma ORM — https://www.prisma.io/docs",
        "PostgreSQL — https://www.postgresql.org/docs",
        "Expo / React Native — https://docs.expo.dev",
        "React Navigation — https://reactnavigation.org/docs/getting-started",
        "Next.js — https://nextjs.org/docs",
        "Passport JWT strategy — https://www.passportjs.org",
    ], style="bodysm"))

    s.append(P("Project status", "h2"))
    ps = [
        [P("Implemented", "cellhdr"), P("Demonstrated workflow", "cellhdr"), P("Known limitation", "cellhdr")],
        [P("4-role auth, route/halt/bus model, full booking-to-delivery lifecycle, PIN-based handover, admin network CRUD", "cell"),
         P("Login → Book → Accept → Handover → Verify → Delivered", "cell"),
         P("No offline mode, no live tracking, no event-timeline API, no PIN recovery, single-record admin lookup only", "cell")],
    ]
    s.append(std_table(ps, [CONTENT_W * 0.4, CONTENT_W * 0.28, CONTENT_W * 0.32], font_size=7.2))
    s.append(Spacer(1, 4))
    s.append(P(
        "This document reflects the state of the Vahak repository at the time of writing. Where the product "
        "README or design materials describe capabilities beyond what is implemented (offline-first sync, QR "
        "scanning, live event timelines, incentive payouts), those are marked above as future scope, not current "
        "functionality.", "captioni"))
    return s


# ----------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------

def main():
    c = canvas_mod.Canvas(OUT_PATH, pagesize=A4)
    c.setTitle("Vahak — Round 2 Technical Documentation")
    c.setAuthor("Vahak Team")

    pages = [
        ("Project Overview", page1),
        ("System Architecture", page2),
        ("System Design & Data Model", page3),
        ("End-to-End Workflow", page4),
        ("Implementation", page5),
        ("Testing & Validation", page6),
        ("Results & Prototype", page7),
        ("Future Scope & References", page8),
    ]

    any_overflow = False
    for i, (title, fn) in enumerate(pages, start=1):
        story = fn()
        leftover = render_page(c, title, i, story)
        if leftover:
            any_overflow = True

    c.save()
    print("Saved:", OUT_PATH)
    if any_overflow:
        print("OVERFLOW DETECTED — see stderr above", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
