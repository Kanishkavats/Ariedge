const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrow');

// Buckets Model[field] into daily counts for the trailing `days` window
// (inclusive of today), zero-filling days with no matching documents.
async function countPerDay(Model, field, days = 14, matchExtra = {}) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const results = await Model.aggregate([
    { $match: { [field]: { $gte: since }, ...matchExtra } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, count: { $sum: 1 } } },
  ]);

  const countByDate = {};
  results.forEach((r) => { countByDate[r._id] = r.count; });

  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      count: countByDate[key] || 0,
    });
  }
  return out;
}

// GET /api/stats
// Admin only
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. KPI Stats
    const totalBooks = await Book.countDocuments();
    const books = await Book.find({}, 'totalCopies availableCopies genre');
    
    let totalCopies = 0;
    let outOfStock = 0;
    
    const categoryCount = {};
    
    books.forEach(b => {
      totalCopies += (b.totalCopies || 0);
      if (b.availableCopies === 0) outOfStock++;
      
      // For top categories
      if (b.genre) {
        categoryCount[b.genre] = (categoryCount[b.genre] || 0) + 1;
      }
    });

    const totalMembers = await User.countDocuments({ role: 'member' });

    // 2. Borrowing Overview
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    const activeBorrows = await Borrow.countDocuments({ status: 'borrowed', dueAt: { $gte: now } });
    const overdueBorrows = await Borrow.countDocuments({ status: 'borrowed', dueAt: { $lt: now } });
    // Due soon: status is borrowed, dueAt is between now and 3 days from now
    const dueSoonBorrows = await Borrow.countDocuments({ status: 'borrowed', dueAt: { $gte: now, $lte: threeDaysFromNow } });
    const returnedBorrows = await Borrow.countDocuments({ status: 'returned' });
    
    const totalTransactions = activeBorrows + overdueBorrows + returnedBorrows;

    // 3. Top Categories
    const topCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    // 4. Recent Transactions
    const recentActivityRaw = await Borrow.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .populate('book', 'title')
      .lean();
      
    const recentTransactions = recentActivityRaw.map((t, index) => {
      // Map to the specific fields needed by the UI table
      const isOverdue = t.status === 'borrowed' && new Date(t.dueAt) < now;
      let displayStatus = 'Active';
      if (t.status === 'returned') displayStatus = 'Returned';
      if (isOverdue) displayStatus = 'Overdue';

      return {
        id: `TRX00${index + 1}`,
        bookTitle: t.book?.title || 'Unknown Book',
        member: t.user?.name || 'Unknown User',
        type: t.status === 'returned' ? 'Return' : 'Borrow', // Assuming if it's currently returned, the last action was a return
        date: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: displayStatus,
      };
    });

    // 5. Book Overview — real cumulative growth of totalBooks/totalCopies
    // over the trailing 14 days, built by walking backwards from the
    // current totals using each book's actual createdAt/totalCopies.
    const OVERVIEW_DAYS = 14;
    const overviewSince = new Date(now);
    overviewSince.setDate(overviewSince.getDate() - (OVERVIEW_DAYS - 1));
    overviewSince.setHours(0, 0, 0, 0);

    const dailyAdditions = await Book.aggregate([
      { $match: { createdAt: { $gte: overviewSince } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newBooks: { $sum: 1 },
          newCopies: { $sum: '$totalCopies' },
        },
      },
    ]);
    const additionsByDate = {};
    dailyAdditions.forEach((d) => { additionsByDate[d._id] = d; });

    const booksAddedInWindow = dailyAdditions.reduce((sum, d) => sum + d.newBooks, 0);
    const copiesAddedInWindow = dailyAdditions.reduce((sum, d) => sum + d.newCopies, 0);

    let runningBooks = totalBooks - booksAddedInWindow;
    let runningCopies = totalCopies - copiesAddedInWindow;

    const bookOverview = [];
    for (let i = 0; i < OVERVIEW_DAYS; i++) {
      const d = new Date(overviewSince);
      d.setDate(overviewSince.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const day = additionsByDate[key];
      runningBooks += day ? day.newBooks : 0;
      runningCopies += day ? day.newCopies : 0;
      bookOverview.push({
        name: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        totalBooks: runningBooks,
        totalCopies: runningCopies,
      });
    }

    // 6. Real month-over-month growth (% of current total added this month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const booksAddedThisMonth = await Book.countDocuments({ createdAt: { $gte: monthStart } });
    const membersJoinedThisMonth = await User.countDocuments({ role: 'member', createdAt: { $gte: monthStart } });
    const copiesAddedThisMonthAgg = await Book.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, sum: { $sum: '$totalCopies' } } },
    ]);
    const copiesAddedThisMonth = copiesAddedThisMonthAgg[0]?.sum || 0;

    // Reported as a plain count ("+3 this month") rather than a % rate —
    // a % is undefined/misleading whenever the pre-this-month baseline is 0
    // (e.g. a fresh library where everything was just added).
    const growth = {
      books: booksAddedThisMonth,
      copies: copiesAddedThisMonth,
      members: membersJoinedThisMonth,
    };

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalCopies,
        totalMembers,
        outOfStock,
        growth,
        borrowingOverview: {
          total: totalTransactions,
          active: activeBorrows,
          returned: returnedBorrows,
          overdue: overdueBorrows,
          dueSoon: dueSoonBorrows,
        },
        topCategories,
        recentTransactions,
        bookOverview,
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/reports
// Admin only. Daily activity trackers + genre breakdown for the Reports page.
exports.getReportsStats = async (req, res, next) => {
  try {
    const [registeredPerDay, updatedPerDay, borrowedPerDay, returnedPerDay] = await Promise.all([
      countPerDay(Book, 'createdAt'),
      // "updated/edited" = a save that happened after creation, not the creation itself.
      countPerDay(Book, 'updatedAt', 14, { $expr: { $gt: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000] } }),
      countPerDay(Borrow, 'borrowedAt'),
      countPerDay(Borrow, 'returnedAt', 14, { returnedAt: { $ne: null } }),
    ]);

    const genreAgg = await Book.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const genreDistribution = genreAgg.map((g) => ({ genre: g._id || 'Uncategorized', count: g.count }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [booksAdded, booksBorrowed, booksReturned, overdueBooks] = await Promise.all([
      Book.countDocuments({ createdAt: { $gte: monthStart } }),
      Borrow.countDocuments({ borrowedAt: { $gte: monthStart } }),
      Borrow.countDocuments({ returnedAt: { $gte: monthStart } }),
      Borrow.countDocuments({ status: 'borrowed', dueAt: { $lt: now } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: { booksAdded, booksBorrowed, booksReturned, overdueBooks },
        registeredPerDay,
        updatedPerDay,
        borrowedPerDay,
        returnedPerDay,
        genreDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/me
// Member-scoped dashboard stats: catalog overview + this member's borrowing status.
exports.getMemberStats = async (req, res, next) => {
  try {
    const books = await Book.find({}, 'totalCopies availableCopies genre');

    let totalCopies = 0;
    let outOfStock = 0;
    const genreSet = new Set();

    books.forEach((b) => {
      totalCopies += b.totalCopies || 0;
      if (b.availableCopies === 0) outOfStock++;
      if (b.genre) genreSet.add(b.genre);
    });

    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    const myBorrows = await Borrow.find({ user: req.user._id });

    let currentlyBorrowed = 0;
    let dueThisWeek = 0;
    let overdue = 0;

    myBorrows.forEach((b) => {
      if (b.status !== 'borrowed') return;
      currentlyBorrowed++;
      if (b.dueAt < now) overdue++;
      else if (b.dueAt <= weekFromNow) dueThisWeek++;
    });

    const popularAgg = await Borrow.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let popularBook = null;
    if (popularAgg.length) {
      const b = await Book.findById(popularAgg[0]._id, 'title');
      popularBook = b?.title || null;
    }

    res.status(200).json({
      success: true,
      data: {
        totalBooks: books.length,
        totalCopies,
        genres: genreSet.size,
        outOfStock,
        currentlyBorrowed,
        dueThisWeek,
        overdue,
        popularBook,
      },
    });
  } catch (err) {
    next(err);
  }
};
